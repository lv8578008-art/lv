import json
import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import (
    User, UserBalance, VIPProduct, Membership,
    FinancialLedger, ReferralCommission, PlatformSetting
)
from ..auth import get_current_user
from ..schemas import VIPProductOut, VIPBuyRequest

router = APIRouter(prefix="/api/vip", tags=["vip"])

@router.get("/products", response_model=List[VIPProductOut])
def get_vip_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    products = db.query(VIPProduct).filter(VIPProduct.is_active == True).order_by(VIPProduct.level.asc()).all()
    
    # Active user membership
    active_mem = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.status == "ACTIVE",
        Membership.expiry_date > datetime.utcnow()
    ).first()

    current_lvl = active_mem.level if active_mem else 0
    user_lvl = current_user.vip_level if current_user.vip_level is not None else 0

    # User's purchase counts per product
    bought_counts = dict(
        db.query(Membership.vip_product_id, func.count(Membership.id))
        .filter(Membership.user_id == current_user.id)
        .group_by(Membership.vip_product_id)
        .all()
    )

    results = []
    for p in products:
        benefits = []
        try:
            benefits = json.loads(p.benefits_json)
        except Exception:
            benefits = [p.benefits_json]

        user_bought = bought_counts.get(p.id, 0)
        total_stk = p.total_stock or 0
        sold_cnt = p.sold_count or 0
        remaining_stk = max(0, total_stk - sold_cnt) if total_stk > 0 else None
        min_lvl = p.min_vip_level or 0
        limit = p.purchase_limit or 0

        can_buy = True
        reason = None

        if min_lvl > 0 and user_lvl < min_lvl:
            can_buy = False
            reason = f"Requires VIP Level {min_lvl} (You are VIP {user_lvl})"
        elif total_stk > 0 and remaining_stk <= 0:
            can_buy = False
            reason = "Sold Out (Stock Limit Reached)"
        elif limit > 0 and user_bought >= limit:
            can_buy = False
            reason = f"Purchase Limit Reached (Max {limit} per member)"

        results.append(VIPProductOut(
            id=p.id,
            level=p.level,
            name=p.name,
            tag=p.tag,
            price=p.price,
            duration_days=p.duration_days,
            daily_benefit_desc=p.daily_benefit_desc,
            daily_income=p.daily_income or 0.0,
            total_return=p.total_return or 0.0,
            benefits=benefits,
            eligibility=p.eligibility,
            terms=p.terms,
            image_url=p.image_url or "",
            is_active=p.is_active,
            is_current=(p.level == current_lvl),
            min_vip_level=min_lvl,
            purchase_limit=limit,
            total_stock=total_stk,
            sold_count=sold_cnt,
            user_purchased_count=user_bought,
            remaining_stock=remaining_stk,
            can_buy=can_buy,
            buy_disabled_reason=reason
        ))
    return results


@router.post("/purchase")
def purchase_vip_membership(
    req: VIPBuyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(VIPProduct).filter(VIPProduct.id == req.product_id, VIPProduct.is_active == True).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VIP Product not found or inactive.")

    user_lvl = current_user.vip_level if current_user.vip_level is not None else 0
    min_lvl = product.min_vip_level or 0

    # 1. Check VIP level requirement
    if min_lvl > 0 and user_lvl < min_lvl:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This product plan requires VIP Level {min_lvl}. Your current account VIP Level is VIP {user_lvl}. Please reach the spend target to unlock VIP Level {min_lvl} first."
        )

    # 2. Check total stock limit
    total_stk = product.total_stock or 0
    sold_cnt = product.sold_count or 0
    if total_stk > 0 and sold_cnt >= total_stk:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This product plan is completely sold out ({sold_cnt}/{total_stk} units purchased)."
        )

    # 3. Check member purchase limit
    limit = product.purchase_limit or 0
    if limit > 0:
        already_bought = db.query(func.count(Membership.id)).filter(
            Membership.user_id == current_user.id,
            Membership.vip_product_id == product.id
        ).scalar() or 0
        if already_bought >= limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Purchase limit reached. Each member can only purchase up to {limit} unit(s) of '{product.name}' (You have already purchased {already_bought})."
            )

    # 4. Check user balance
    bal = db.query(UserBalance).filter(UserBalance.user_id == current_user.id).with_for_update().first()
    if not bal or bal.available_balance < product.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Product price is ₹{product.price:,.2f}, but your available balance is ₹{bal.available_balance:,.2f if bal else 0.0}."
        )

    # Deduct balance atomically: consume non-withdrawable deposit_balance first, then settlement_balance
    price_to_deduct = product.price
    dep_bal = bal.deposit_balance or 0.0
    settle_bal = bal.settlement_balance or 0.0

    if dep_bal >= price_to_deduct:
        bal.deposit_balance = dep_bal - price_to_deduct
    else:
        remainder = price_to_deduct - dep_bal
        bal.deposit_balance = 0.0
        bal.settlement_balance = max(0.0, settle_bal - remainder)

    bal.available_balance -= price_to_deduct
    bal.updated_at = datetime.utcnow()

    # Increment product sold count
    product.sold_count = (product.sold_count or 0) + 1
    bal.updated_at = datetime.utcnow()

    # 2. Add Ledger Entry
    purchase_ref = f"PLN-{uuid.uuid4().hex[:8].upper()}"
    ledger_entry = FinancialLedger(
        user_id=current_user.id,
        type="VIP_PURCHASE",
        amount=-product.price,
        balance_after=bal.available_balance,
        reference_id=purchase_ref,
        description=f"Purchased product plan '{product.name}' (₹{product.price:,.2f}) for {product.duration_days} days."
    )
    db.add(ledger_entry)

    # 3. Create Membership / Product Subscription
    from ..settlement_service import get_next_midnight_ist
    now = datetime.utcnow()
    new_mem = Membership(
        user_id=current_user.id,
        vip_product_id=product.id,
        level=product.level,
        price_paid=product.price,
        start_date=now,
        expiry_date=now + timedelta(days=product.duration_days),
        status="ACTIVE",
        days_credited=0,
        total_income_credited=0.0,
        last_credit_date=None,
        next_credit_at=get_next_midnight_ist()
    )
    db.add(new_mem)

    # 4. Process 3-Tier Referral Commission
    rates = {1: 10.0, 2: 3.0, 3: 1.5}
    # Read configured rates from settings if available
    for lvl in [1, 2, 3]:
        s = db.query(PlatformSetting).filter(PlatformSetting.key == f"ref_l{lvl}_rate").first()
        if s and s.value:
            try:
                rates[lvl] = float(s.value)
            except Exception:
                pass

    current_parent_id = current_user.referred_by_id
    visited = {current_user.id} # prevent circular references

    for level in range(1, 4):
        if not current_parent_id or current_parent_id in visited:
            break
        visited.add(current_parent_id)

        parent = db.query(User).filter(User.id == current_parent_id, User.status == "active").first()
        if not parent:
            break

        rate = rates.get(level, 0.0)
        comm_amount = round((rate / 100.0) * product.price, 2)

        if comm_amount > 0:
            parent_bal = db.query(UserBalance).filter(UserBalance.user_id == parent.id).with_for_update().first()
            if parent_bal:
                parent_bal.available_balance += comm_amount
                parent_bal.settlement_balance = (parent_bal.settlement_balance or 0.0) + comm_amount
                parent_bal.total_commission += comm_amount
                parent_bal.updated_at = datetime.utcnow()

                comm_ref = f"REF-{uuid.uuid4().hex[:8].upper()}"
                
                # Record referral commission
                ref_comm = ReferralCommission(
                    txn_id=comm_ref,
                    referrer_id=parent.id,
                    buyer_id=current_user.id,
                    level=level,
                    source_event="VIP_PURCHASE",
                    purchase_amount=product.price,
                    rate=rate,
                    commission_amount=comm_amount,
                    status="APPROVED"
                )
                db.add(ref_comm)

                # Add parent ledger entry
                parent_ledger = FinancialLedger(
                    user_id=parent.id,
                    type="REFERRAL_COMMISSION",
                    amount=comm_amount,
                    balance_after=parent_bal.available_balance,
                    reference_id=comm_ref,
                    description=f"Level {level} Referral Bonus ({rate}%) from user {current_user.account_id}'s VIP {product.level} purchase."
                )
                db.add(parent_ledger)

        current_parent_id = parent.referred_by_id

    # 5. Evaluate and promote VIP level based on cumulative plan purchase
    from ..vip_service import get_user_vip_progress
    db.commit() # ensure new membership is committed to calculate sum

    vip_progress = get_user_vip_progress(current_user.id, db, current_user)
    new_vip_lvl = vip_progress["current_level"]

    message = f"Successfully purchased plan '{product.name}'!"
    if product.daily_income and product.daily_income > 0:
        message += f" 💰 Daily return of ₹{product.daily_income:,.2f} will be automatically credited to your account at 12:00 AM tonight!"
    if vip_progress["amount_needed"] == 0 and new_vip_lvl >= 1:
        message += f" 🏆 Congratulations! You have unlocked {vip_progress['level_name']}!"
    elif vip_progress["next_level"]:
        message += f" (Progress: ₹{vip_progress['total_plan_purchases']:,.0f} spent - {vip_progress['task_prompt']})"

    return {
        "success": True,
        "message": message,
        "product_id": product.id,
        "product_name": product.name,
        "daily_income": product.daily_income,
        "duration_days": product.duration_days,
        "daily_settlement_time": "12:00 AM IST (00:00)",
        "current_vip_level": new_vip_lvl,
        "vip_progress": vip_progress,
        "expiry_date": new_mem.expiry_date.strftime("%Y-%m-%d %H:%M:%S"),
        "remaining_balance": round(bal.available_balance, 2)
    }


@router.get("/progress")
def get_vip_progress_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..vip_service import get_user_vip_progress
    return get_user_vip_progress(current_user.id, db, current_user)

