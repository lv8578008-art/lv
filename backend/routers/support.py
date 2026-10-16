import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, SupportTicket
from ..auth import get_current_user
from ..schemas import TicketCreate
from ..utils import format_datetime_ist

router = APIRouter(prefix="/api/support", tags=["support"])

@router.post("/tickets")
def create_support_ticket(
    req: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket_id = f"TCK-{uuid.uuid4().hex[:8].upper()}"
    new_ticket = SupportTicket(
        ticket_id=ticket_id,
        user_id=current_user.id,
        subject=req.subject.strip(),
        category=req.category,
        message=req.message.strip(),
        status="OPEN"
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return {
        "success": True,
        "message": "Complaint/ticket submitted successfully. Our support team will review it shortly.",
        "ticket": {
            "id": new_ticket.id,
            "ticket_id": new_ticket.ticket_id,
            "subject": new_ticket.subject,
            "category": new_ticket.category,
            "message": new_ticket.message,
            "status": new_ticket.status,
            "created_at": format_datetime_ist(new_ticket.created_at)
        }
    }


@router.get("/tickets")
def get_user_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tickets = db.query(SupportTicket).filter(
        SupportTicket.user_id == current_user.id
    ).order_by(SupportTicket.created_at.desc()).all()

    return [
        {
            "id": t.id,
            "ticket_id": t.ticket_id,
            "subject": t.subject,
            "category": t.category,
            "message": t.message,
            "status": t.status,
            "admin_reply": t.admin_reply,
            "created_at": format_datetime_ist(t.created_at),
            "updated_at": format_datetime_ist(t.updated_at)
        } for t in tickets
    ]
