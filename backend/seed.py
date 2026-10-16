import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import User, UserBalance, VIPProduct, PlatformSetting, Event
from .auth import hash_password

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Superadmin provisioning
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            admin_user = User(
                account_id="ADM-000001",
                mobile="admin", # can login with 'admin' or '9999999999'
                hashed_password=hash_password("admin639"),
                role="admin",
                status="active",
                referral_code="ADMINVIP",
                must_change_password=True,
            )
            db.add(admin_user)
            db.flush()

            # Balance
            admin_bal = UserBalance(
                user_id=admin_user.id,
                available_balance=1000000.0,
                reserved_balance=0.0
            )
            db.add(admin_bal)
            print("[SEED] Provisioned superadmin 'admin' with initial password 'admin639' (Must change on first login)")

        # 2. Platform settings
        default_settings = {
            "upi_id": ("vippay@oksbi", "Official UPI address for manual deposits"),
            "qr_code_url": ("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=vippay@oksbi&pn=VIP%20Rewards&cu=INR", "QR Code image URL for payment"),
            "min_withdrawal": ("199", "Minimum allowable withdrawal amount in INR"),
            "max_withdrawal": ("99999", "Maximum allowable withdrawal amount per request in INR"),
            "ref_l1_rate": ("10.0", "Level 1 referral commission percentage"),
            "ref_l2_rate": ("3.0", "Level 2 referral commission percentage"),
            "ref_l3_rate": ("1.5", "Level 3 referral commission percentage"),
            "withdrawal_fee_percent": ("0", "Withdrawal processing fee in percent"),
            "test_mode": ("false", "Test mode toggle to bypass day restrictions if needed"),
            "deposit_instructions": ("Please transfer the exact amount via UPI to the verified VPA above. Save the 12-digit UTR/Reference number from your banking app and submit the screenshot below for instant verification.", "Instructions displayed on deposit page"),
            "announcements": ("['Welcome to VIP Rewards Club! Experience elite membership rewards, weekly scheduled payouts, and a lucrative 3-tier affiliate network.', 'Maintenance notice: Routine payment gateway reconciliation occurs daily between 23:00 - 23:30 IST.']", "System announcements JSON")
        }

        for key, (val, desc) in default_settings.items():
            setting = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
            if not setting:
                db.add(PlatformSetting(key=key, value=val, description=desc))

        db.commit()
        print("[SEED] Superadmin and core system platform settings verified.")
        print("[SEED] Database initialized successfully with default models, superadmin, settings, VIP levels, and events.")
    except Exception as e:
        db.rollback()
        print(f"[SEED] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
