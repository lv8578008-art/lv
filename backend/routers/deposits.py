import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import razorpay

from ..database import get_db
from ..models import User, DepositRequest, PlatformSetting, UserBalance, FinancialLedger
from ..auth import get_current_user
from ..schemas import DepositCreate, DepositOut

router = APIRouter(prefix="/api/deposits", tags=["deposits"])


def get_razorpay_config(db: Session):
    """Retrieves Razorpay credentials from PlatformSetting or .env."""
    key_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "razorpay_key_id").first()
    secret_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "razorpay_key_secret").first()
    enabled_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "razorpay_enabled").first()

    key_id = (key_setting.value.strip() if key_setting and key_setting.value else "") or os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = (secret_setting.value.strip() if secret_setting and secret_setting.value else "") or os.getenv("RAZORPAY_KEY_SECRET", "")
    
    # If explicitly enabled or credentials exist
    is_enabled = enabled_setting.value.lower() == "true" if enabled_setting and enabled_setting.value else bool(key_id and key_secret)

    return key_id, key_secret, is_enabled


@router.get("/config")
def get_deposit_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upi_id = db.query(PlatformSetting).filter(PlatformSetting.key == "upi_id").first()
    qr_code = db.query(PlatformSetting).filter(PlatformSetting.key == "qr_code_url").first()
    instr = db.query(PlatformSetting).filter(PlatformSetting.key == "deposit_instructions").first()
    merchant = db.query(PlatformSetting).filter(PlatformSetting.key == "merchant_name").first()

    active_upi = upi_id.value if upi_id and upi_id.value else "vippay@oksbi"
    merchant_name = merchant.value if merchant and merchant.value else "VIP Rewards"
    if active_upi.startswith("http://") or active_upi.startswith("https://"):
        default_qr = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={active_upi}"
    else:
        default_qr = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa={active_upi}%26pn={merchant_name}%26cu=INR"

    rzp_key_id, _, rzp_enabled = get_razorpay_config(db)

    return {
        "upi_id": active_upi,
        "qr_code_url": qr_code.value if qr_code and qr_code.value else default_qr,
        "instructions": instr.value if instr and instr.value else "Transfer funds to the verified UPI ID. Submit your 12-digit UTR number and payment receipt.",
        "customer_account_id": current_user.account_id,
        "customer_mobile": current_user.mobile,
        "merchant_name": merchant_name,
        "razorpay_enabled": rzp_enabled,
        "razorpay_key_id": rzp_key_id
    }


# ========================================================
# RAZORPAY GATEWAY AUTOMATED DEPOSITS
# ========================================================

@router.post("/razorpay/create-order")
def create_razorpay_order(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new Razorpay order for instant, automated deposit.
    """
    amount = float(payload.get("amount", 0))
    if amount < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum deposit amount is ₹100."
        )

    key_id, key_secret, is_enabled = get_razorpay_config(db)
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay is not yet configured on this platform. Please set Razorpay Key ID and Secret in Admin Settings."
        )

    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        amount_in_paise = int(round(amount * 100))
        receipt_id = f"RZP-{uuid.uuid4().hex[:8].upper()}"

        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": receipt_id,
            "notes": {
                "user_id": str(current_user.id),
                "account_id": current_user.account_id,
                "mobile": current_user.mobile
            }
        }
        order = client.order.create(data=order_data)

        return {
            "success": True,
            "order_id": order["id"],
            "amount": amount,
            "amount_in_paise": amount_in_paise,
            "currency": "INR",
            "key_id": key_id,
            "receipt": receipt_id,
            "customer_name": current_user.username or f"User {current_user.account_id}",
            "customer_mobile": current_user.mobile,
            "customer_account_id": current_user.account_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Razorpay Order Error: {str(e)}"
        )


@router.post("/razorpay/verify-payment")
def verify_razorpay_payment(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifies the cryptographic Razorpay payment signature and immediately credits the user wallet.
    Idempotent: Avoids duplicate credits if webhook or network retry fires.
    """
    order_id = payload.get("razorpay_order_id")
    payment_id = payload.get("razorpay_payment_id")
    signature = payload.get("razorpay_signature")
    amount = float(payload.get("amount", 0))

    if not order_id or not payment_id or not signature or amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required Razorpay payment verification parameters."
        )

    key_id, key_secret, _ = get_razorpay_config(db)
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay credentials missing from system settings."
        )

    # 1. Cryptographic HMAC-SHA256 signature verification
    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        client.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment signature verification failed: {str(e)}"
        )

    # 2. Idempotency Check: Check if this payment_id has already been credited
    existing_dep = db.query(DepositRequest).filter(
        DepositRequest.utr == payment_id
    ).first()

    user_bal = db.query(UserBalance).filter(
        UserBalance.user_id == current_user.id
    ).with_for_update().first()

    if not user_bal:
        user_bal = UserBalance(user_id=current_user.id, available_balance=0.0)
        db.add(user_bal)
        db.flush()

    if existing_dep:
        # Already processed
        return {
            "success": True,
            "message": "Payment already verified and credited.",
            "txn_id": existing_dep.txn_id,
            "new_balance": user_bal.available_balance
        }

    # 3. Credit user wallet balance
    user_bal.available_balance = (user_bal.available_balance or 0.0) + amount
    user_bal.deposit_balance = (user_bal.deposit_balance or 0.0) + amount
    user_bal.total_deposited = (user_bal.total_deposited or 0.0) + amount
    user_bal.updated_at = datetime.utcnow()

    # 4. Create Approved Deposit Request record
    txn_id = f"DEP-RZP-{uuid.uuid4().hex[:6].upper()}"
    new_deposit = DepositRequest(
        txn_id=txn_id,
        user_id=current_user.id,
        amount=amount,
        utr=payment_id,
        screenshot_url="razorpay_auto_verified",
        status="APPROVED",
        admin_notes=f"Auto-verified via Razorpay (Order: {order_id})",
        reviewed_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )
    db.add(new_deposit)

    # 5. Record Financial Ledger Entry
    ledger = FinancialLedger(
        user_id=current_user.id,
        type="DEPOSIT",
        amount=amount,
        balance_after=user_bal.available_balance,
        reference_id=payment_id,
        description=f"Automated deposit credit via Razorpay Gateway (Ref: {payment_id})"
    )
    db.add(ledger)

    db.commit()

    return {
        "success": True,
        "message": f"Payment of ₹{amount:,.2f} verified successfully! Your wallet has been credited.",
        "txn_id": txn_id,
        "new_balance": user_bal.available_balance,
        "payment_id": payment_id
    }


# ========================================================
# MANUAL UPI & UTR DEPOSITS
# ========================================================

@router.get("/check-utr")
def check_utr_availability(
    utr: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_utr = utr.strip()
    if not clean_utr:
        return {"exists": False, "utr": ""}
    existing = db.query(DepositRequest).filter(DepositRequest.utr == clean_utr).first()
    return {"exists": existing is not None, "utr": clean_utr}


@router.post("", response_model=DepositOut)
def create_deposit_request(
    req: DepositCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_utr = req.utr.strip()

    # Reject duplicate UTR numbers
    existing_utr = db.query(DepositRequest).filter(DepositRequest.utr == clean_utr).first()
    if existing_utr:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A deposit request with this UTR/Reference number has already been submitted."
        )

    txn_id = f"DEP-{uuid.uuid4().hex[:8].upper()}"

    new_deposit = DepositRequest(
        txn_id=txn_id,
        user_id=current_user.id,
        amount=req.amount,
        utr=clean_utr,
        screenshot_url=req.screenshot_url,
        status="PENDING"
    )
    db.add(new_deposit)
    db.commit()
    db.refresh(new_deposit)

    return DepositOut(
        id=new_deposit.id,
        txn_id=new_deposit.txn_id,
        amount=new_deposit.amount,
        utr=new_deposit.utr,
        screenshot_url=new_deposit.screenshot_url,
        status=new_deposit.status,
        admin_notes=new_deposit.admin_notes,
        reviewed_at=new_deposit.reviewed_at,
        created_at=new_deposit.created_at
    )


@router.get("", response_model=List[DepositOut])
def get_user_deposits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deposits = db.query(DepositRequest).filter(
        DepositRequest.user_id == current_user.id
    ).order_by(DepositRequest.created_at.desc()).all()

    return [
        DepositOut(
            id=d.id,
            txn_id=d.txn_id,
            amount=d.amount,
            utr=d.utr,
            screenshot_url=d.screenshot_url,
            status=d.status,
            admin_notes=d.admin_notes,
            reviewed_at=d.reviewed_at,
            created_at=d.created_at
        ) for d in deposits
    ]
