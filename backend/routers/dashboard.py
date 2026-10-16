import json
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import (
    User, UserBalance, Membership, VIPProduct,
    DepositRequest, WithdrawalRequest, ReferralCommission,
    FinancialLedger, PlatformSetting
)
from ..auth import get_current_user
from ..schemas import DashboardSummary
from ..utils import format_datetime_ist

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 12:00 AM Settlement Sync: ensure any pending return for current user is credited before reading balances
    try:
        from ..settlement_service import process_daily_income_settlement
        process_daily_income_settlement(db, user_id_filter=current_user.id)
    except Exception as e:
        print(f"[Dashboard Settlement Sync Error]: {e}")

    # Balances
    bal = db.query(UserBalance).filter(UserBalance.user_id == current_user.id).first()
    avail = bal.available_balance if bal else 0.0
    reserved = bal.reserved_balance if bal else 0.0
    tot_dep = bal.total_deposited if bal else 0.0
    tot_with = bal.total_withdrawn if bal else 0.0
    tot_comm = bal.total_commission if bal else 0.0

    # Pending deposits
    pending_dep = db.query(func.coalesce(func.sum(DepositRequest.amount), 0.0)).filter(
        DepositRequest.user_id == current_user.id,
        DepositRequest.status == "PENDING"
    ).scalar()

    # Pending withdrawals
    pending_with = db.query(func.coalesce(func.sum(WithdrawalRequest.requested_amount), 0.0)).filter(
        WithdrawalRequest.user_id == current_user.id,
        WithdrawalRequest.status == "PENDING"
    ).scalar()

    # VIP Progress & Tier info
    from ..vip_service import get_user_vip_progress
    vip_info = get_user_vip_progress(current_user.id, db, current_user)
    current_vip_lvl = vip_info["current_level"]
    current_vip_name = f"{vip_info['level_name']} ({vip_info['level_tag']})"

    # Active plan/membership if any
    active_mem = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.status == "ACTIVE",
        Membership.expiry_date > datetime.utcnow()
    ).order_by(Membership.created_at.desc()).first()

    membership_status = "ACTIVE" if active_mem else "INACTIVE"
    membership_expiry = active_mem.expiry_date if active_mem else None

    # Recent transactions from FinancialLedger
    recent_ledger = db.query(FinancialLedger).filter(
        FinancialLedger.user_id == current_user.id
    ).order_by(FinancialLedger.created_at.desc()).limit(8).all()

    recent_txns = []
    for entry in recent_ledger:
        recent_txns.append({
            "id": entry.id,
            "type": entry.type,
            "amount": entry.amount,
            "balance_after": entry.balance_after,
            "reference_id": entry.reference_id,
            "description": entry.description,
            "date": format_datetime_ist(entry.created_at)
        })

    # System Announcements
    announcements = ["Welcome to VIP Rewards Club! Experience elite privileges and weekly payouts."]
    ann_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "announcements").first()
    if ann_setting and ann_setting.value:
        try:
            parsed = json.loads(ann_setting.value)
            if isinstance(parsed, list):
                announcements = parsed
        except Exception:
            announcements = [ann_setting.value]

    # 12:00 AM Daily Settlement Status & Info
    from ..settlement_service import get_settlement_status, get_ist_now, get_next_midnight_ist
    settlement_status = get_settlement_status(db)

    # Active membership daily income details
    active_daily_income = 0.0
    active_days_credited = 0
    active_total_duration = 30
    active_total_credited = 0.0
    if active_mem and active_mem.product:
        active_daily_income = float(active_mem.product.daily_income or 0.0)
        active_days_credited = active_mem.days_credited or 0
        active_total_duration = active_mem.product.duration_days or 30
        active_total_credited = float(active_mem.total_income_credited or 0.0)

    user_settlement_info = {
        "engine_status": settlement_status["engine_status"],
        "next_midnight_run": settlement_status["next_midnight_run"],
        "time_until_midnight": settlement_status["time_until_midnight"],
        "has_active_plan": bool(active_mem),
        "daily_income_amount": active_daily_income,
        "days_credited": active_days_credited,
        "duration_days": active_total_duration,
        "total_earned_from_plans": active_total_credited,
        "today_settled": (active_mem.last_credit_date == settlement_status["today_date"]) if active_mem else False,
        "settlement_rule": "Every day at 12:00 AM (00:00 IST), active plan returns are automatically credited to your balance."
    }

    tot_plan_inc = bal.total_plan_income if bal and bal.total_plan_income else 0.0
    dep_bal = bal.deposit_balance if bal and bal.deposit_balance is not None else 0.0
    settle_bal = bal.settlement_balance if bal and bal.settlement_balance is not None else 0.0

    return DashboardSummary(
        account_id=current_user.account_id,
        username=current_user.username,
        mobile=current_user.mobile,
        role=current_user.role,
        status=current_user.status,
        referral_code=current_user.referral_code,
        current_vip_level=current_vip_lvl,
        current_vip_name=current_vip_name,
        membership_status=membership_status,
        membership_expiry=membership_expiry,
        available_balance=round(avail, 2),
        reserved_balance=round(reserved, 2),
        deposit_balance=round(dep_bal, 2),
        settlement_balance=round(settle_bal, 2),
        pending_deposit_amount=round(float(pending_dep), 2),
        pending_withdrawal_amount=round(float(pending_with), 2),
        approved_referral_rewards=round(tot_comm, 2),
        total_deposited=round(tot_dep, 2),
        total_withdrawn=round(tot_with, 2),
        total_plan_purchases=vip_info["total_plan_purchases"],
        total_plan_income=round(tot_plan_inc, 2),
        daily_settlement_info=user_settlement_info,
        next_vip_level=vip_info["next_level"],
        next_vip_threshold=vip_info["next_threshold"],
        vip_amount_needed=vip_info["amount_needed"],
        vip_progress_percent=vip_info["progress_percent"],
        vip_task_prompt=vip_info["task_prompt"],
        vip_progress=vip_info,
        recent_transactions=recent_txns,
        announcements=announcements
    )
