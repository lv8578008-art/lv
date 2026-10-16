from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import User, UserBalance, ReferralCommission, PlatformSetting
from ..auth import get_current_user
from ..schemas import ReferralDashboardOut
from ..utils import format_datetime_ist

router = APIRouter(prefix="/api/referrals", tags=["referrals"])

@router.get("", response_model=ReferralDashboardOut)
def get_referral_dashboard(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Commission rates
    rates = {"level_1": 10.0, "level_2": 3.0, "level_3": 1.5}
    for lvl in [1, 2, 3]:
        s = db.query(PlatformSetting).filter(PlatformSetting.key == f"ref_l{lvl}_rate").first()
        if s and s.value:
            try:
                rates[f"level_{lvl}"] = float(s.value)
            except Exception:
                pass

    # Level 1 users (directly invited)
    l1_users = db.query(User).filter(User.referred_by_id == current_user.id).all()
    l1_ids = [u.id for u in l1_users]

    # Level 2 users
    l2_ids = []
    if l1_ids:
        l2_users = db.query(User).filter(User.referred_by_id.in_(l1_ids)).all()
        l2_ids = [u.id for u in l2_users]

    # Level 3 users
    l3_ids = []
    if l2_ids:
        l3_users = db.query(User).filter(User.referred_by_id.in_(l2_ids)).all()
        l3_ids = [u.id for u in l3_users]

    # Commissions
    commissions = db.query(ReferralCommission).filter(
        ReferralCommission.referrer_id == current_user.id
    ).order_by(ReferralCommission.created_at.desc()).all()

    approved_comm = sum(c.commission_amount for c in commissions if c.status == "APPROVED")
    pending_comm = sum(c.commission_amount for c in commissions if c.status == "PENDING")

    comm_list = []
    for c in commissions:
        buyer = db.query(User).filter(User.id == c.buyer_id).first()
        comm_list.append({
            "id": c.id,
            "txn_id": c.txn_id,
            "level": c.level,
            "buyer_account_id": buyer.account_id if buyer else "Unknown",
            "purchase_amount": c.purchase_amount,
            "rate": c.rate,
            "commission_amount": c.commission_amount,
            "status": c.status,
            "date": format_datetime_ist(c.created_at)
        })

    # Recent directly invited members
    recent_members = []
    for u in l1_users[:5]:
        recent_members.append({
            "account_id": u.account_id,
            "mobile_masked": u.mobile[:2] + "******" + u.mobile[-2:],
            "joined_date": format_datetime_ist(u.created_at)
        })

    # Share link
    base_url = str(request.base_url).rstrip("/")
    # Replace backend port if requested from frontend
    share_link = f"http://localhost:5173/signup?ref={current_user.referral_code}"

    bal = db.query(UserBalance).filter(UserBalance.user_id == current_user.id).first()
    tot_earned = bal.total_commission if bal else approved_comm

    return ReferralDashboardOut(
        referral_code=current_user.referral_code,
        share_link=share_link,
        rates=rates,
        direct_referrals_count=len(l1_ids),
        level_2_count=len(l2_ids),
        level_3_count=len(l3_ids),
        eligible_transactions_count=len(commissions),
        pending_commissions=round(pending_comm, 2),
        approved_commissions=round(approved_comm, 2),
        total_commission_earned=round(tot_earned, 2),
        recent_referrals=recent_members,
        commissions=comm_list
    )
