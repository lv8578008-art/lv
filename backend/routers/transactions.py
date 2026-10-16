import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    User, DepositRequest, WithdrawalRequest,
    ReferralCommission, Membership, VIPProduct
)
from ..auth import get_current_user
from ..utils import format_datetime_ist

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.get("/all")
def get_all_transactions(
    category: str = Query("deposits", pattern="^(deposits|withdrawals|referrals|vip)$"),
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if category == "deposits":
        query = db.query(DepositRequest).filter(DepositRequest.user_id == current_user.id)
        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(DepositRequest.status == status_filter.upper())
        items = query.order_by(DepositRequest.created_at.desc()).all()
        return [
            {
                "id": d.id,
                "txn_id": d.txn_id,
                "amount": d.amount,
                "utr": d.utr,
                "screenshot_url": d.screenshot_url,
                "status": d.status,
                "admin_notes": d.admin_notes,
                "date": format_datetime_ist(d.created_at)
            } for d in items
        ]

    elif category == "withdrawals":
        query = db.query(WithdrawalRequest).filter(WithdrawalRequest.user_id == current_user.id)
        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(WithdrawalRequest.status == status_filter.upper())
        items = query.order_by(WithdrawalRequest.created_at.desc()).all()
        results = []
        for w in items:
            details = {}
            try:
                details = json.loads(w.payout_details_json)
            except Exception:
                pass
            results.append({
                "id": w.id,
                "withdrawal_id": w.withdrawal_id,
                "amount": w.requested_amount,
                "fee": w.fee_amount,
                "net_amount": w.net_amount,
                "payout_method": w.payout_method_type,
                "payout_details": details,
                "permitted_day": w.permitted_day,
                "status": w.status,
                "payout_reference": w.payout_reference,
                "admin_notes": w.admin_notes,
                "date": format_datetime_ist(w.created_at)
            })
        return results

    elif category == "referrals":
        query = db.query(ReferralCommission).filter(ReferralCommission.referrer_id == current_user.id)
        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(ReferralCommission.status == status_filter.upper())
        items = query.order_by(ReferralCommission.created_at.desc()).all()
        results = []
        for c in items:
            buyer = db.query(User).filter(User.id == c.buyer_id).first()
            results.append({
                "id": c.id,
                "txn_id": c.txn_id,
                "level": c.level,
                "buyer": buyer.account_id if buyer else "Member",
                "purchase_amount": c.purchase_amount,
                "rate": c.rate,
                "commission_amount": c.commission_amount,
                "status": c.status,
                "date": format_datetime_ist(c.created_at)
            })
        return results

    elif category == "vip":
        query = db.query(Membership).filter(Membership.user_id == current_user.id)
        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(Membership.status == status_filter.upper())
        items = query.order_by(Membership.created_at.desc()).all()
        results = []
        for m in items:
            product = db.query(VIPProduct).filter(VIPProduct.id == m.vip_product_id).first()
            results.append({
                "id": m.id,
                "vip_level": m.level,
                "product_name": product.name if product else f"VIP {m.level}",
                "price_paid": m.price_paid,
                "start_date": format_datetime_ist(m.start_date),
                "expiry_date": format_datetime_ist(m.expiry_date),
                "is_expired": (
                    (m.expiry_date if m.expiry_date.tzinfo else m.expiry_date.replace(tzinfo=timezone.utc)) < datetime.now(timezone.utc)
                ) if m.expiry_date else True
            })
        return results

    return []
