from datetime import datetime, timezone, timedelta
from typing import Optional

# Indian Standard Time (UTC+05:30)
IST = timezone(timedelta(hours=5, minutes=30))

def format_datetime_ist(dt: Optional[datetime]) -> str:
    if not dt:
        return "-"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    ist_dt = dt.astimezone(IST)
    return ist_dt.strftime("%d %b %Y, %I:%M:%S %p")

def format_date_ist(dt: Optional[datetime]) -> str:
    if not dt:
        return "-"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    ist_dt = dt.astimezone(IST)
    return ist_dt.strftime("%d %b %Y")

def get_now_utc() -> datetime:
    return datetime.now(timezone.utc)

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
