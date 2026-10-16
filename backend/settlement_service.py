import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from .models import User, UserBalance, Membership, VIPProduct, FinancialLedger

IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime:
    """Returns current datetime in Indian Standard Time (UTC+5:30)."""
    return datetime.now(IST)

def get_ist_today_str() -> str:
    """Returns today's date string in IST format: YYYY-MM-DD."""
    return get_ist_now().strftime("%Y-%m-%d")

def get_next_midnight_ist() -> datetime:
    """Returns the next 12:00 AM (00:00:00) IST timestamp."""
    now_ist = get_ist_now()
    tomorrow = now_ist.date() + timedelta(days=1)
    return datetime(tomorrow.year, tomorrow.month, tomorrow.day, 0, 0, 0, tzinfo=IST)

def to_ist_datetime(dt: Optional[datetime]) -> datetime:
    """Safely converts any datetime (naive UTC or aware) to IST datetime."""
    if dt is None:
        return get_ist_now()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST)

def get_settlement_status(db: Session) -> Dict[str, Any]:
    """Returns status of 12:00 AM settlement engine and active memberships."""
    now_ist = get_ist_now()
    today_date = now_ist.date()
    today_str = now_ist.strftime("%Y-%m-%d")
    next_midnight = get_next_midnight_ist()
    seconds_until = max(0, int((next_midnight - now_ist).total_seconds()))
    hours_until = seconds_until // 3600
    mins_until = (seconds_until % 3600) // 60

    active_memberships = db.query(Membership).filter(
        Membership.status == "ACTIVE"
    ).all()

    total_active = len(active_memberships)
    settled_today_count = 0
    pending_settlement_count = 0

    for m in active_memberships:
        start_ist = to_ist_datetime(m.start_date)
        first_settle_date = start_ist.date() + timedelta(days=1)
        # If the plan was created today, its first credit is tomorrow midnight
        if first_settle_date > today_date:
            continue
        if m.last_credit_date == today_str:
            settled_today_count += 1
        else:
            pending_settlement_count += 1

    # Calculate total daily yield pool for active plans
    daily_yield_pool = 0.0
    for m in active_memberships:
        if m.product and m.product.daily_income:
            daily_yield_pool += float(m.product.daily_income)

    return {
        "ist_current_time": now_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
        "today_date": today_str,
        "next_midnight_run": next_midnight.strftime("%Y-%m-%d 00:00:00 IST"),
        "time_until_midnight": f"{hours_until}h {mins_until}m",
        "total_active_plans": total_active,
        "settled_today_count": settled_today_count,
        "pending_today_count": pending_settlement_count,
        "daily_yield_pool": round(daily_yield_pool, 2),
        "engine_status": "ONLINE_ACTIVE"
    }

def process_daily_income_settlement(
    db: Session,
    target_date: Optional[str] = None,
    force_run: bool = False,
    user_id_filter: Optional[int] = None
) -> Dict[str, Any]:
    """
    Settles 12:00 AM daily return income for all active user plans.
    Guarantees:
    - Automatically catches up any uncredited dates up to today (or target_date).
    - Fully idempotent: Uses reference ID 'INC-{membership_id}-{date}' to guarantee no double credits.
    - Accurately credits available_balance, settlement_balance, and total_plan_income.
    - Records an audit entry in financial_ledger for every credited return.
    """
    now_ist = get_ist_now()
    today_ist = now_ist.date()

    if target_date:
        try:
            max_target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        except Exception:
            max_target_date = today_ist
    else:
        max_target_date = today_ist

    query = db.query(Membership).filter(Membership.status == "ACTIVE")
    if user_id_filter:
        query = query.filter(Membership.user_id == user_id_filter)

    active_mems = query.all()
    settled_records = []
    total_amount_credited = 0.0
    skipped_count = 0

    for mem in active_mems:
        prod = mem.product
        if not prod or not prod.daily_income or prod.daily_income <= 0:
            continue

        days_done = mem.days_credited or 0
        max_days = prod.duration_days or 30
        if days_done >= max_days:
            mem.status = "COMPLETED"
            continue

        start_ist = to_ist_datetime(mem.start_date)
        first_settle_date = start_ist.date() + timedelta(days=1)

        if mem.last_credit_date:
            try:
                last_date = datetime.strptime(mem.last_credit_date, "%Y-%m-%d").date()
                next_settle_date = last_date + timedelta(days=1)
            except Exception:
                next_settle_date = first_settle_date
        else:
            next_settle_date = first_settle_date

        daily_amount = float(prod.daily_income)

        # Force run handler for explicit manual overrides
        if force_run and next_settle_date > max_target_date:
            d_str = max_target_date.strftime("%Y-%m-%d")
            ref_id = f"INC-{mem.id}-{d_str}-FORCE-{uuid.uuid4().hex[:6]}"
            user_bal = db.query(UserBalance).filter(
                UserBalance.user_id == mem.user_id
            ).with_for_update().first()

            if not user_bal:
                user_bal = UserBalance(user_id=mem.user_id, available_balance=0.0)
                db.add(user_bal)
                db.flush()

            user_bal.available_balance = (user_bal.available_balance or 0.0) + daily_amount
            user_bal.settlement_balance = (user_bal.settlement_balance or 0.0) + daily_amount
            user_bal.total_plan_income = (user_bal.total_plan_income or 0.0) + daily_amount
            user_bal.updated_at = datetime.utcnow()

            new_days_credited = (mem.days_credited or 0) + 1
            mem.days_credited = new_days_credited
            mem.total_income_credited = (mem.total_income_credited or 0.0) + daily_amount
            mem.last_credit_date = d_str
            mem.next_credit_at = get_next_midnight_ist()

            if new_days_credited >= max_days:
                mem.status = "COMPLETED"

            ledger = FinancialLedger(
                user_id=mem.user_id,
                type="DAILY_INCOME",
                amount=daily_amount,
                balance_after=user_bal.available_balance,
                reference_id=ref_id,
                description=f"12:00 AM Daily Return: ₹{daily_amount:,.2f} from '{prod.name}' (Day {new_days_credited}/{max_days})"
            )
            db.add(ledger)

            total_amount_credited += daily_amount
            settled_records.append({
                "membership_id": mem.id,
                "user_id": mem.user_id,
                "product_name": prod.name,
                "daily_income": daily_amount,
                "settlement_date": d_str,
                "days_credited": new_days_credited,
                "max_days": max_days,
                "is_completed": (new_days_credited >= max_days),
                "new_balance": user_bal.available_balance
            })
            continue

        if next_settle_date > max_target_date:
            skipped_count += 1
            continue

        # Process any pending dates up to max_target_date in chronological sequence
        curr_date = next_settle_date
        while curr_date <= max_target_date and (mem.days_credited or 0) < max_days:
            d_str = curr_date.strftime("%Y-%m-%d")
            ref_check = f"INC-{mem.id}-{d_str}"

            existing_ledger = db.query(FinancialLedger).filter(
                FinancialLedger.reference_id == ref_check
            ).first()

            if existing_ledger:
                mem.last_credit_date = d_str
                skipped_count += 1
                curr_date += timedelta(days=1)
                continue

            user_bal = db.query(UserBalance).filter(
                UserBalance.user_id == mem.user_id
            ).with_for_update().first()

            if not user_bal:
                user_bal = UserBalance(user_id=mem.user_id, available_balance=0.0)
                db.add(user_bal)
                db.flush()

            user_bal.available_balance = (user_bal.available_balance or 0.0) + daily_amount
            user_bal.settlement_balance = (user_bal.settlement_balance or 0.0) + daily_amount
            user_bal.total_plan_income = (user_bal.total_plan_income or 0.0) + daily_amount
            user_bal.updated_at = datetime.utcnow()

            new_days_credited = (mem.days_credited or 0) + 1
            mem.days_credited = new_days_credited
            mem.total_income_credited = (mem.total_income_credited or 0.0) + daily_amount
            mem.last_credit_date = d_str
            mem.next_credit_at = get_next_midnight_ist()

            if new_days_credited >= max_days:
                mem.status = "COMPLETED"

            ledger = FinancialLedger(
                user_id=mem.user_id,
                type="DAILY_INCOME",
                amount=daily_amount,
                balance_after=user_bal.available_balance,
                reference_id=ref_check,
                description=f"12:00 AM Daily Return: ₹{daily_amount:,.2f} from '{prod.name}' (Day {new_days_credited}/{max_days})"
            )
            db.add(ledger)

            total_amount_credited += daily_amount
            settled_records.append({
                "membership_id": mem.id,
                "user_id": mem.user_id,
                "product_name": prod.name,
                "daily_income": daily_amount,
                "settlement_date": d_str,
                "days_credited": new_days_credited,
                "max_days": max_days,
                "is_completed": (new_days_credited >= max_days),
                "new_balance": user_bal.available_balance
            })

            curr_date += timedelta(days=1)

    db.commit()

    return {
        "success": True,
        "settlement_date": max_target_date.strftime("%Y-%m-%d"),
        "settled_count": len(settled_records),
        "skipped_already_settled": skipped_count,
        "total_amount_credited": round(total_amount_credited, 2),
        "records": settled_records
    }
