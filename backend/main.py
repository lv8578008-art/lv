import os
import uuid
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base, SessionLocal
from .seed import seed_database
from .settlement_service import process_daily_income_settlement, get_ist_now
from .routers import (
    auth, dashboard, vip, deposits, withdrawals,
    referrals, transactions, events, support, admin
)

# Initialize database schema & seed
Base.metadata.create_all(bind=engine)
seed_database()


async def settlement_scheduler_worker():
    """
    Background worker that runs every 60 seconds.
    Monitors IST time: Automatically disburses daily plan return income
    to all active user memberships as soon as 12:00 AM (00:00 IST) is reached,
    and automatically catches up any missed settlements.
    Fully idempotent and safe to run continuously.
    """
    # Wait a few seconds after startup before the continuous loop
    await asyncio.sleep(5)
    while True:
        try:
            with SessionLocal() as db:
                res = process_daily_income_settlement(db)
                if res.get("settled_count", 0) > 0:
                    print(
                        f"[12:00 AM Daily Settlement]: Credited {res['settled_count']} active plans "
                        f"with total ₹{res['total_amount_credited']:,.2f} on {res['settlement_date']}"
                    )
        except Exception as e:
            print(f"[Settlement Worker Error]: {e}")
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run immediate settlement catch-up on server boot
    try:
        with SessionLocal() as db:
            res = process_daily_income_settlement(db)
            if res.get("settled_count", 0) > 0:
                print(f"[Startup Settlement Catch-up]: Credited {res['settled_count']} plans with total ₹{res['total_amount_credited']:,.2f}")
    except Exception as e:
        print(f"[Startup Settlement Error]: {e}")

    # Start continuous 12:00 AM settlement background scheduler
    task = asyncio.create_task(settlement_scheduler_worker())
    yield
    task.cancel()


app = FastAPI(
    title="VIP Rewards & Membership Platform API",
    description="Enterprise-grade backend for VIP membership management, 3-tier referral tracking, deposit verification, and scheduled withdrawals.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/api/uploads/screenshot")
@app.post("/api/upload/screenshot")
async def upload_screenshot(file: UploadFile = File(...)):
    # Validate content type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Allowed formats: JPG, PNG, WEBP."
        )

    # Validate file size (up to 5MB)
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 5MB limit.")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "png"
    safe_filename = f"proof_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, safe_filename)

    with open(filepath, "wb") as f:
        f.write(file_bytes)

    # Return relative URL
    return {
        "success": True,
        "url": f"/api/uploads/{safe_filename}",
        "filename": safe_filename
    }


# Static files mount placed AFTER explicit routes to avoid Starlette 405 Method Not Allowed
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(vip.router)
app.include_router(deposits.router)
app.include_router(withdrawals.router)
app.include_router(referrals.router)
app.include_router(transactions.router)
app.include_router(events.router)
app.include_router(support.router)
app.include_router(admin.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "VIP Rewards API", "version": "1.0.0"}
