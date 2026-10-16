from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Event, User, Membership
from ..auth import get_current_user
from ..schemas import EventOut

router = APIRouter(prefix="/api/events", tags=["events"])

@router.get("", response_model=List[EventOut])
def get_events(
    status_filter: Optional[str] = Query("ALL", pattern="^(ALL|UPCOMING|LIVE|COMPLETED)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Event).filter(Event.status != "ARCHIVED")
    if status_filter and status_filter != "ALL":
        query = query.filter(Event.status == status_filter)

    events = query.order_by(Event.start_time.asc()).all()

    # Dynamic status update based on time
    now = datetime.now(timezone.utc)
    for ev in events:
        if ev.status != "ARCHIVED":
            st = ev.start_time if (ev.start_time and ev.start_time.tzinfo) else (ev.start_time.replace(tzinfo=timezone.utc) if ev.start_time else None)
            et = ev.end_time if (ev.end_time and ev.end_time.tzinfo) else (ev.end_time.replace(tzinfo=timezone.utc) if ev.end_time else None)
            if st and now < st:
                ev.status = "UPCOMING"
            elif st and et and st <= now <= et:
                ev.status = "LIVE"
            elif et and now > et:
                ev.status = "COMPLETED"

    return events


@router.get("/{event_id}", response_model=EventOut)
def get_event_detail(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev
