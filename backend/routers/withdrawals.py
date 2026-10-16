import json
import uuid
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    User, UserBalance, WithdrawalRequest, PayoutMethod,
    Membership, FinancialLedger, PlatformSetting
)
from ..auth import get_current_user
from ..schemas import (
    WithdrawalCreate, WithdrawalOut, PayoutMethodCreate, PayoutMethodOut
)
from ..settlement_service import get_ist_now

router = APIRouter(prefix="/api/withdrawals", tags=["withdrawals"])

SCHEDULE_DAYS = {
    0: "Sunday",
    1: "Saturday",
    2: "Friday",
    3: "Thursday",
    4: "Wednesday",
    5: "Tuesday",
    6: "Monday",
    7: "Any Day"
}

@router.get("/methods", response_model=List[PayoutMethodOut])
def get_payout_methods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    methods = db.query(PayoutMethod).filter(PayoutMethod.user_id == current_user.id).all()
    return methods


@router.post("/methods", response_model=PayoutMethodOut)
def add_payout_method(
    req: PayoutMethodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If set default, remove default from others
    db.query(PayoutMethod).filter(PayoutMethod.user_id == current_user.id).update({"is_default": False})

    new_method = PayoutMethod(
        user_id=current_user.id,
        type=req.type,
        account_holder=req.account_holder.strip(),
        account_number=req.account_number.strip() if req.account_number else None,
        ifsc_code=req.ifsc_code.strip().upper() if req.ifsc_code else None,
        bank_name=req.bank_name.strip() if req.bank_name else None,
        upi_id=req.upi_id.strip() if req.upi_id else None,
        is_default=True,
        is_verified=True
    )
    db.add(new_method)
    db.commit()
    db.refresh(new_method)
    return new_method


@router.get("/schedule-info")
def get_schedule_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..vip_service import get_user_vip_progress
    vip_info = get_user_vip_progress(current_user.id, db, current_user)
    lvl = vip_info["current_level"]
    permitted_day = SCHEDULE_DAYS.get(lvl, "Sunday")

    # Current weekday in IST
    # Python weekday(): Monday is 0 and Sunday is 6
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today_name = day_names[get_ist_now().weekday()]

    test_mode_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "test_mode").first()
    is_test_mode = test_mode_setting.value.lower() == "true" if test_mode_setting else False

    # VIP 7 gets daily priority withdrawal
    is_eligible_today = is_test_mode or (lvl == 7) or (today_name.lower() == permitted_day.lower())

    fee_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "withdrawal_fee_percent").first()
    fee_pct = float(fee_setting.value) if fee_setting and fee_setting.value else 0.0

    # User balance breakdowns
    bal = db.query(UserBalance).filter(UserBalance.user_id == current_user.id).first()
    avail_bal = bal.available_balance if bal else 0.0
    settle_bal = bal.settlement_balance if bal and bal.settlement_balance is not None else 0.0
    dep_bal = bal.deposit_balance if bal and bal.deposit_balance is not None else 0.0

    return {
        "current_vip_level": lvl,
        "permitted_day": permitted_day,
        "today_day": today_name,
        "is_eligible_today": is_eligible_today,
        "test_mode": is_test_mode,
        "min_amount": 199.0,
        "max_amount": 99999.0,
        "fee_percent": fee_pct,
        "schedule_map": SCHEDULE_DAYS,
        "available_balance": round(avail_bal, 2),
        "withdrawable_settlement_balance": round(settle_bal, 2),
        "deposit_balance": round(dep_bal, 2),
        "payout_sla_notice": "Withdrawals are processed on your VIP day and released within 24 to 42 hours. Please be patient.",
        "deposit_rule_notice": "Deposit funds can only be used to purchase product plans, not for withdrawal. Only settlement earnings (daily returns & commissions) can be withdrawn."
    }


@router.post("", response_model=WithdrawalOut)
def request_withdrawal(
    req: WithdrawalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validation amount
    if req.amount < 199 or req.amount > 99999:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Withdrawal amount must be between ₹199 and ₹99,999."
        )

    # 2. Check VIP level and Day Schedule
    from ..vip_service import get_user_vip_progress
    vip_info = get_user_vip_progress(current_user.id, db, current_user)
    user_vip_lvl = vip_info["current_level"]
    permitted_day = SCHEDULE_DAYS.get(user_vip_lvl, "Sunday")

    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today_name = day_names[get_ist_now().weekday()]

    test_mode_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "test_mode").first()
    is_test_mode = test_mode_setting.value.lower() == "true" if test_mode_setting else False

    # VIP 7 can withdraw on any day; otherwise check permitted day
    if not is_test_mode and user_vip_lvl != 7 and (today_name.lower() != permitted_day.lower()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"VIP Level {user_vip_lvl} members can submit withdrawals on {permitted_day}. Today is {today_name}."
        )

    # 3. Payout Method
    method = db.query(PayoutMethod).filter(
        PayoutMethod.id == req.payout_method_id,
        PayoutMethod.user_id == current_user.id
    ).first()
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selected payout method not found. Please add a valid bank account or UPI ID."
        )

    payout_details = {
        "type": method.type,
        "account_holder": method.account_holder,
        "account_number": method.account_number,
        "ifsc_code": method.ifsc_code,
        "bank_name": method.bank_name,
        "upi_id": method.upi_id
    }

    # 4. Check withdrawable settlement balance and lock atomically
    bal = db.query(UserBalance).filter(UserBalance.user_id == current_user.id).with_for_update().first()
    if not bal or bal.available_balance < req.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Requested ₹{req.amount:,.2f}, available balance is ₹{bal.available_balance:,.2f if bal else 0.0}."
        )

    settle_bal = bal.settlement_balance or 0.0
    if req.amount > settle_bal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Deposit funds can only be used to purchase product plans, not for withdrawal. "
                f"Only settlement earnings (daily returns & commissions) can be withdrawn. "
                f"Your current withdrawable settlement balance is ₹{settle_bal:,.2f}."
            )
        )

    # Calculate fee
    fee_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "withdrawal_fee_percent").first()
    fee_pct = float(fee_setting.value) if fee_setting and fee_setting.value else 0.0
    fee_amount = round((fee_pct / 100.0) * req.amount, 2)
    net_payable = round(req.amount - fee_amount, 2)

    # Lock funds atomically from available and settlement balances
    bal.available_balance -= req.amount
    bal.settlement_balance = max(0.0, settle_bal - req.amount)
    bal.reserved_balance += req.amount
    bal.updated_at = datetime.utcnow()

    wth_id = f"WTH-{uuid.uuid4().hex[:8].upper()}"

    # Ledger entry for fund lock
    ledger = FinancialLedger(
        user_id=current_user.id,
        type="WITHDRAWAL_LOCK",
        amount=-req.amount,
        balance_after=bal.available_balance,
        reference_id=wth_id,
        description=f"Locked funds for withdrawal request {wth_id} (Net payable: ₹{net_payable:,.2f})."
    )
    db.add(ledger)

    wth_req = WithdrawalRequest(
        withdrawal_id=wth_id,
        user_id=current_user.id,
        vip_level=user_vip_lvl,
        requested_amount=req.amount,
        fee_amount=fee_amount,
        net_amount=net_payable,
        payout_method_type=method.type,
        payout_details_json=json.dumps(payout_details),
        permitted_day=permitted_day,
        status="PENDING"
    )
    db.add(wth_req)
    db.commit()
    db.refresh(wth_req)

    return WithdrawalOut(
        id=wth_req.id,
        withdrawal_id=wth_req.withdrawal_id,
        requested_amount=wth_req.requested_amount,
        fee_amount=wth_req.fee_amount,
        net_amount=wth_req.net_amount,
        payout_method_type=wth_req.payout_method_type,
        payout_details=payout_details,
        permitted_day=wth_req.permitted_day,
        status=wth_req.status,
        payout_reference=wth_req.payout_reference,
        admin_notes=wth_req.admin_notes,
        created_at=wth_req.created_at
    )


@router.get("", response_model=List[WithdrawalOut])
def get_user_withdrawals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    withdrawals = db.query(WithdrawalRequest).filter(
        WithdrawalRequest.user_id == current_user.id
    ).order_by(WithdrawalRequest.created_at.desc()).all()

    results = []
    for w in withdrawals:
        details = {}
        try:
            details = json.loads(w.payout_details_json)
        except Exception:
            pass

        results.append(WithdrawalOut(
            id=w.id,
            withdrawal_id=w.withdrawal_id,
            requested_amount=w.requested_amount,
            fee_amount=w.fee_amount,
            net_amount=w.net_amount,
            payout_method_type=w.payout_method_type,
            payout_details=details,
            permitted_day=w.permitted_day,
            status=w.status,
            payout_reference=w.payout_reference,
            admin_notes=w.admin_notes,
            created_at=w.created_at
        ))
    return results
