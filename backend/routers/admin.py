import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import (
    User, UserBalance, VIPProduct, Membership, DepositRequest,
    WithdrawalRequest, ReferralCommission, Event, PlatformSetting,
    AuditLog, SupportTicket, FinancialLedger
)
from ..auth import get_current_admin, hash_password
from ..schemas import (
    DepositDecision, WithdrawalDecision, VIPProductUpdate, VIPProductCreate,
    EventCreate, TicketReply, AdminPasswordChange
)
from ..utils import format_datetime_ist

router = APIRouter(prefix="/api/admin", tags=["admin"])

def log_audit(db: Session, admin_id: int, action: str, target_type: str, target_id: str, details: str):
    audit = AuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        details=details
    )
    db.add(audit)


# --- 1. OVERVIEW & STATS ---

@router.get("/stats")
def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).filter(User.role != "admin").count()
    active_memberships = db.query(Membership).filter(
        Membership.status == "ACTIVE",
        Membership.expiry_date > datetime.utcnow()
    ).count()

    pending_deposits_count = db.query(DepositRequest).filter(DepositRequest.status == "PENDING").count()
    pending_deposits_sum = db.query(func.coalesce(func.sum(DepositRequest.amount), 0.0)).filter(DepositRequest.status == "PENDING").scalar()

    pending_withdrawals_count = db.query(WithdrawalRequest).filter(WithdrawalRequest.status == "PENDING").count()
    pending_withdrawals_sum = db.query(func.coalesce(func.sum(WithdrawalRequest.requested_amount), 0.0)).filter(WithdrawalRequest.status == "PENDING").scalar()

    verified_deposits_sum = db.query(func.coalesce(func.sum(DepositRequest.amount), 0.0)).filter(DepositRequest.status == "APPROVED").scalar()
    completed_withdrawals_sum = db.query(func.coalesce(func.sum(WithdrawalRequest.net_amount), 0.0)).filter(WithdrawalRequest.status == "PAID").scalar()

    total_commission_distributed = db.query(func.coalesce(func.sum(ReferralCommission.commission_amount), 0.0)).filter(ReferralCommission.status == "APPROVED").scalar()
    pending_tickets = db.query(SupportTicket).filter(SupportTicket.status == "OPEN").count()

    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    audit_list = []
    for l in recent_logs:
        audit_list.append({
            "id": l.id,
            "action": l.action,
            "target": f"{l.target_type} #{l.target_id}",
            "details": l.details,
            "date": format_datetime_ist(l.created_at)
        })

    return {
        "total_users": total_users,
        "active_memberships": active_memberships,
        "pending_deposits_count": pending_deposits_count,
        "pending_deposits_sum": round(float(pending_deposits_sum), 2),
        "pending_withdrawals_count": pending_withdrawals_count,
        "pending_withdrawals_sum": round(float(pending_withdrawals_sum), 2),
        "verified_deposits_sum": round(float(verified_deposits_sum), 2),
        "completed_withdrawals_sum": round(float(completed_withdrawals_sum), 2),
        "total_commission_distributed": round(float(total_commission_distributed), 2),
        "pending_tickets_count": pending_tickets,
        "recent_audit_logs": audit_list
    }


# --- 2. USER MANAGEMENT ---

@router.get("/users")
def get_all_users(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role != "admin")

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((User.account_id.ilike(s)) | (User.mobile.ilike(s)) | (User.referral_code.ilike(s)))

    if status_filter and status_filter != "ALL":
        query = query.filter(User.status == status_filter.lower())

    users = query.order_by(User.created_at.desc()).all()

    from ..vip_service import get_user_vip_progress

    user_list = []
    for u in users:
        bal = db.query(UserBalance).filter(UserBalance.user_id == u.id).first()
        vip_info = get_user_vip_progress(u.id, db, u)

        user_list.append({
            "id": u.id,
            "account_id": u.account_id,
            "mobile": u.mobile,
            "status": u.status,
            "referral_code": u.referral_code,
            "created_at": format_datetime_ist(u.created_at),
            "available_balance": round(bal.available_balance, 2) if bal else 0.0,
            "reserved_balance": round(bal.reserved_balance, 2) if bal else 0.0,
            "vip_level": vip_info["current_level"],
            "vip_name": vip_info["level_name"],
            "total_plan_purchases": vip_info["total_plan_purchases"],
            "next_level": vip_info["next_level"],
            "task_prompt": vip_info["task_prompt"],
            "membership_status": "ACTIVE" if vip_info["total_plan_purchases"] > 0 else "INACTIVE",
        })

    return user_list


@router.post("/users/{user_id}/set-vip-level")
def set_user_vip_level(
    user_id: int,
    payload: Dict[str, Any],
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user or target_user.role == "admin":
        raise HTTPException(status_code=404, detail="User not found")

    new_lvl = int(payload.get("vip_level", 0))
    if new_lvl < 0 or new_lvl > 7:
        raise HTTPException(status_code=400, detail="VIP Level must be between 0 and 7")

    target_user.vip_level = new_lvl
    target_user.updated_at = datetime.utcnow()

    log_audit(
        db, admin.id, "SET_VIP_LEVEL", "User", str(target_user.id),
        f"Manually assigned VIP Level {new_lvl} to {target_user.account_id} ({target_user.mobile})"
    )
    db.commit()

    return {"success": True, "vip_level": new_lvl, "message": f"User assigned to VIP Level {new_lvl}"}


@router.post("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user or target_user.role == "admin":
        raise HTTPException(status_code=404, detail="User not found")

    new_status = "suspended" if target_user.status == "active" else "active"
    target_user.status = new_status
    target_user.updated_at = datetime.utcnow()

    log_audit(
        db, admin.id, f"TOGGLE_USER_STATUS", "User", str(target_user.id),
        f"Changed status of {target_user.account_id} ({target_user.mobile}) to {new_status}"
    )
    db.commit()

    return {"success": True, "status": new_status, "message": f"User status set to {new_status}"}


# --- 3. DEPOSIT MANAGEMENT ---

@router.get("/deposits")
def get_admin_deposits(
    status_filter: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(DepositRequest)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(DepositRequest.status == status_filter.upper())

    deposits = query.order_by(DepositRequest.created_at.desc()).all()

    results = []
    for d in deposits:
        user = db.query(User).filter(User.id == d.user_id).first()
        results.append({
            "id": d.id,
            "txn_id": d.txn_id,
            "user_id": d.user_id,
            "account_id": user.account_id if user else "Unknown",
            "mobile": user.mobile if user else "Unknown",
            "amount": d.amount,
            "utr": d.utr,
            "screenshot_url": d.screenshot_url,
            "status": d.status,
            "admin_notes": d.admin_notes,
            "reviewed_at": d.reviewed_at.strftime("%Y-%m-%d %H:%M") if d.reviewed_at else None,
            "created_at": d.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return results


@router.post("/deposits/{deposit_id}/decide")
def decide_deposit(
    deposit_id: int,
    req: DepositDecision,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    dep = db.query(DepositRequest).filter(DepositRequest.id == deposit_id).with_for_update().first()
    if not dep:
        raise HTTPException(status_code=404, detail="Deposit request not found")

    if dep.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Deposit already has status {dep.status}")

    dep.status = req.status
    dep.admin_id = admin.id
    dep.admin_notes = req.admin_notes or ("Approved by administrator" if req.status == "APPROVED" else "Rejected by administrator")
    dep.reviewed_at = datetime.utcnow()

    user_bal = db.query(UserBalance).filter(UserBalance.user_id == dep.user_id).with_for_update().first()

    if req.status == "APPROVED":
        if user_bal:
            user_bal.available_balance += dep.amount
            user_bal.deposit_balance = (user_bal.deposit_balance or 0.0) + dep.amount
            user_bal.total_deposited += dep.amount
            user_bal.updated_at = datetime.utcnow()

            # Ledger entry
            ledger = FinancialLedger(
                user_id=dep.user_id,
                type="DEPOSIT",
                amount=dep.amount,
                balance_after=user_bal.available_balance,
                reference_id=dep.txn_id,
                description=f"Verified deposit credit via UTR: {dep.utr}"
            )
            db.add(ledger)

    log_audit(
        db, admin.id, f"DEPOSIT_{req.status}", "DepositRequest", str(dep.id),
        f"{req.status} deposit {dep.txn_id} of ₹{dep.amount:,.2f} for user #{dep.user_id}. Note: {dep.admin_notes}"
    )

    db.commit()
    return {"success": True, "message": f"Deposit request {req.status.lower()} successfully."}


# --- 4. WITHDRAWAL MANAGEMENT ---

@router.get("/withdrawals")
def get_admin_withdrawals(
    status_filter: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(WithdrawalRequest)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(WithdrawalRequest.status == status_filter.upper())

    withdrawals = query.order_by(WithdrawalRequest.created_at.desc()).all()

    results = []
    for w in withdrawals:
        user = db.query(User).filter(User.id == w.user_id).first()
        payout_details = {}
        try:
            payout_details = json.loads(w.payout_details_json)
        except Exception:
            pass

        results.append({
            "id": w.id,
            "withdrawal_id": w.withdrawal_id,
            "user_id": w.user_id,
            "account_id": user.account_id if user else "Unknown",
            "mobile": user.mobile if user else "Unknown",
            "vip_level": w.vip_level,
            "requested_amount": w.requested_amount,
            "fee_amount": w.fee_amount,
            "net_amount": w.net_amount,
            "payout_method_type": w.payout_method_type,
            "payout_details": payout_details,
            "permitted_day": w.permitted_day,
            "status": w.status,
            "payout_reference": w.payout_reference,
            "admin_notes": w.admin_notes,
            "reviewed_at": w.reviewed_at.strftime("%Y-%m-%d %H:%M") if w.reviewed_at else None,
            "created_at": w.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return results


@router.post("/withdrawals/{withdrawal_id}/decide")
def decide_withdrawal(
    withdrawal_id: int,
    req: WithdrawalDecision,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    wth = db.query(WithdrawalRequest).filter(WithdrawalRequest.id == withdrawal_id).with_for_update().first()
    if not wth:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")

    if wth.status not in ["PENDING", "PROCESSING"]:
        raise HTTPException(status_code=400, detail=f"Withdrawal already has final status {wth.status}")

    user_bal = db.query(UserBalance).filter(UserBalance.user_id == wth.user_id).with_for_update().first()

    if req.status in ["PAID", "APPROVED"]:
        wth.status = "PAID"
        wth.payout_reference = req.payout_reference or f"IMPS-{uuid.uuid4().hex[:10].upper()}"
        wth.admin_notes = req.admin_notes or "Disbursed to recipient bank/UPI"
        wth.admin_id = admin.id
        wth.reviewed_at = datetime.utcnow()

        if user_bal:
            user_bal.reserved_balance = max(0.0, user_bal.reserved_balance - wth.requested_amount)
            user_bal.total_withdrawn += wth.requested_amount
            user_bal.updated_at = datetime.utcnow()

            ledger = FinancialLedger(
                user_id=wth.user_id,
                type="WITHDRAWAL_PAID",
                amount=-wth.net_amount,
                balance_after=user_bal.available_balance,
                reference_id=wth.withdrawal_id,
                description=f"Paid withdrawal {wth.withdrawal_id}. Bank Ref: {wth.payout_reference}"
            )
            db.add(ledger)

    elif req.status == "REJECTED":
        wth.status = "REJECTED"
        wth.admin_notes = req.admin_notes or "Rejected by administrator. Funds restored."
        wth.admin_id = admin.id
        wth.reviewed_at = datetime.utcnow()

        # Release reserved funds back to user
        if user_bal:
            user_bal.reserved_balance = max(0.0, user_bal.reserved_balance - wth.requested_amount)
            user_bal.available_balance += wth.requested_amount
            user_bal.settlement_balance = (user_bal.settlement_balance or 0.0) + wth.requested_amount
            user_bal.updated_at = datetime.utcnow()

            ledger = FinancialLedger(
                user_id=wth.user_id,
                type="WITHDRAWAL_REFUND",
                amount=wth.requested_amount,
                balance_after=user_bal.available_balance,
                reference_id=wth.withdrawal_id,
                description=f"Refunded reserved amount for rejected withdrawal {wth.withdrawal_id}: {wth.admin_notes}"
            )
            db.add(ledger)

    log_audit(
        db, admin.id, f"WITHDRAWAL_{wth.status}", "WithdrawalRequest", str(wth.id),
        f"{wth.status} withdrawal {wth.withdrawal_id} (₹{wth.requested_amount}). Ref: {wth.payout_reference}"
    )

    db.commit()
    return {"success": True, "message": f"Withdrawal request updated to {wth.status}."}


# --- 5. VIP PRODUCTS MANAGEMENT ---

@router.put("/vip-products/{product_id}")
def update_vip_product(
    product_id: int,
    req: VIPProductUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    prod = db.query(VIPProduct).filter(VIPProduct.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="VIP Product not found")

    if req.name is not None: prod.name = req.name
    if req.tag is not None: prod.tag = req.tag
    if req.price is not None: prod.price = req.price
    if req.duration_days is not None: prod.duration_days = req.duration_days
    if req.daily_benefit_desc is not None: prod.daily_benefit_desc = req.daily_benefit_desc
    if req.daily_income is not None: prod.daily_income = req.daily_income
    if req.total_return is not None: prod.total_return = req.total_return
    if req.image_url is not None: prod.image_url = req.image_url
    if req.benefits is not None: prod.benefits_json = json.dumps(req.benefits)
    if req.eligibility is not None: prod.eligibility = req.eligibility
    if req.terms is not None: prod.terms = req.terms
    if req.is_active is not None: prod.is_active = req.is_active
    if req.min_vip_level is not None: prod.min_vip_level = req.min_vip_level
    if req.purchase_limit is not None: prod.purchase_limit = req.purchase_limit
    if req.total_stock is not None: prod.total_stock = req.total_stock

    log_audit(
        db, admin.id, "UPDATE_VIP_PRODUCT", "VIPProduct", str(prod.id),
        f"Updated plan #{prod.id} ({prod.name}) price ₹{prod.price}, VIP req: {prod.min_vip_level}, limit: {prod.purchase_limit}, stock: {prod.total_stock}"
    )
    db.commit()
    return {"success": True, "message": f"VIP Product #{prod.level} updated successfully."}


@router.post("/vip-products")
def create_vip_product(
    req: VIPProductCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    max_level = db.query(func.max(VIPProduct.level)).scalar() or 0
    if req.level is None or req.level <= 0 or db.query(VIPProduct).filter(VIPProduct.level == req.level).first():
        req.level = max_level + 1

    daily_benefit = req.daily_benefit_desc or f"₹{req.daily_income:,.0f} Daily Income"
    total_ret = req.total_return if req.total_return is not None else (req.daily_income * req.duration_days)

    new_prod = VIPProduct(
        level=req.level,
        name=req.name.strip(),
        tag=req.tag or "Hot Plan",
        price=req.price,
        duration_days=req.duration_days,
        daily_benefit_desc=daily_benefit,
        daily_income=req.daily_income,
        total_return=total_ret,
        benefits_json=json.dumps(req.benefits or [daily_benefit]),
        eligibility=req.eligibility or "Open to all members",
        terms=req.terms or "Standard investment plan terms apply.",
        image_url=req.image_url or "",
        is_active=req.is_active,
        min_vip_level=req.min_vip_level or 0,
        purchase_limit=req.purchase_limit or 0,
        total_stock=req.total_stock or 0,
        sold_count=0,
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)

    log_audit(
        db, admin.id, "CREATE_PRODUCT", "VIPProduct", str(new_prod.id),
        f"Posted new plan #{new_prod.id} ({new_prod.name}) price ₹{new_prod.price}"
    )

    return {"success": True, "message": f"Plan '{new_prod.name}' posted successfully.", "product_id": new_prod.id}


@router.delete("/vip-products/{product_id}")
def delete_vip_product(
    product_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    prod = db.query(VIPProduct).filter(VIPProduct.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    prod_name = prod.name
    db.delete(prod)
    db.commit()

    log_audit(
        db, admin.id, "DELETE_PRODUCT", "VIPProduct", str(product_id),
        f"Deleted product plan {prod_name}"
    )
    return {"success": True, "message": f"Plan '{prod_name}' deleted successfully."}


@router.get("/vip-levels")
def get_vip_levels(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from ..vip_service import get_vip_levels_config
    return get_vip_levels_config(db)


@router.put("/vip-levels")
def update_vip_levels(
    payload: List[Dict[str, Any]],
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from ..vip_service import save_vip_levels_config
    if not isinstance(payload, list) or len(payload) == 0:
        raise HTTPException(status_code=400, detail="Invalid VIP levels payload")

    updated = save_vip_levels_config(db, payload)
    log_audit(
        db, admin.id, "UPDATE_VIP_LEVELS", "PlatformSetting", "vip_levels_config",
        f"Updated VIP levels configuration and spend thresholds"
    )
    return {"success": True, "message": "VIP level thresholds and rules saved successfully.", "levels": updated}


# --- 6. EVENT MANAGEMENT ---

@router.post("/events")
def create_event(
    req: EventCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    new_event = Event(
        title=req.title,
        description=req.description,
        banner_url=req.banner_url or "",
        min_vip_level=req.min_vip_level,
        start_time=req.start_time,
        end_time=req.end_time,
        status=req.status or "UPCOMING",
        terms=req.terms or "Terms apply."
    )
    db.add(new_event)
    log_audit(db, admin.id, "CREATE_EVENT", "Event", req.title, f"Created event '{req.title}'")
    db.commit()
    db.refresh(new_event)
    return {"success": True, "event_id": new_event.id}


@router.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    ev.status = "ARCHIVED"
    log_audit(db, admin.id, "ARCHIVE_EVENT", "Event", str(event_id), f"Archived event '{ev.title}'")
    db.commit()
    return {"success": True, "message": "Event archived."}


# --- 7. SUPPORT / COMPLAINTS MANAGEMENT ---

@router.get("/tickets")
def get_admin_tickets(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    tickets = db.query(SupportTicket).order_by(SupportTicket.created_at.desc()).all()
    results = []
    for t in tickets:
        user = db.query(User).filter(User.id == t.user_id).first()
        results.append({
            "id": t.id,
            "ticket_id": t.ticket_id,
            "user_id": t.user_id,
            "account_id": user.account_id if user else "Unknown",
            "mobile": user.mobile if user else "Unknown",
            "subject": t.subject,
            "category": t.category,
            "message": t.message,
            "status": t.status,
            "admin_reply": t.admin_reply,
            "created_at": format_datetime_ist(t.created_at),
            "updated_at": format_datetime_ist(t.updated_at)
        })
    return results


@router.post("/tickets/{ticket_id}/reply")
def reply_ticket(
    ticket_id: int,
    req: TicketReply,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.admin_reply = req.reply
    ticket.status = req.status
    ticket.updated_at = datetime.utcnow()

    log_audit(db, admin.id, "REPLY_TICKET", "SupportTicket", ticket.ticket_id, f"Replied to ticket {ticket.ticket_id}")
    db.commit()
    return {"success": True, "message": "Reply saved successfully."}


# --- 8. SYSTEM SETTINGS ---

@router.get("/settings")
def get_system_settings(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    settings = db.query(PlatformSetting).all()
    return {s.key: s.value for s in settings}


@router.post("/settings")
def update_system_settings(
    updates: Dict[str, str],
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    for key, val in updates.items():
        s = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
        if s:
            s.value = val
            s.updated_at = datetime.utcnow()
        else:
            db.add(PlatformSetting(key=key, value=val))

    log_audit(db, admin.id, "UPDATE_SETTINGS", "PlatformSetting", "global", f"Updated keys: {', '.join(updates.keys())}")
    db.commit()
    return {"success": True, "message": "System settings updated successfully."}


# --- 9. ADMIN FORCED PASSWORD CHANGE ---

@router.post("/change-password")
def admin_change_password(
    req: AdminPasswordChange,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    admin.hashed_password = hash_password(req.new_password)
    admin.must_change_password = False
    admin.updated_at = datetime.utcnow()

    log_audit(db, admin.id, "ADMIN_PASSWORD_CHANGE", "User", str(admin.id), "Superadmin changed password and rotated initial setup credential")
    db.commit()

    return {"success": True, "message": "Admin password updated successfully. Initial credentials rotated."}


# --- 10. 12:00 AM DAILY INCOME SETTLEMENT ENGINE ---

@router.get("/settlement/status")
def get_daily_settlement_status(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from ..settlement_service import get_settlement_status
    return get_settlement_status(db)


@router.post("/settlement/run")
def trigger_daily_settlement(
    payload: Optional[Dict[str, Any]] = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from ..settlement_service import process_daily_income_settlement
    target_date = payload.get("target_date") if payload else None
    force_run = bool(payload.get("force_run", False)) if payload else False
    
    res = process_daily_income_settlement(db, target_date=target_date, force_run=force_run)
    log_audit(
        db, admin.id, "TRIGGER_DAILY_SETTLEMENT", "Membership", "batch",
        f"Executed 12:00 AM settlement: {res['settled_count']} plans credited, ₹{res['total_amount_credited']:,.2f} disbursed for date {res['settlement_date']}"
    )
    db.commit()
    return res

