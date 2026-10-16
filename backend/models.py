from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String(50), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=True)
    mobile = Column(String(20), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # 'user', 'admin'
    status = Column(String(20), default="active")  # 'active', 'suspended'
    referral_code = Column(String(20), unique=True, index=True, nullable=False)
    referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    must_change_password = Column(Boolean, default=False)
    vip_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    balance = relationship("UserBalance", uselist=False, back_populates="user", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")
    deposits = relationship("DepositRequest", back_populates="user", foreign_keys="DepositRequest.user_id")
    withdrawals = relationship("WithdrawalRequest", back_populates="user", foreign_keys="WithdrawalRequest.user_id")
    payout_methods = relationship("PayoutMethod", back_populates="user", cascade="all, delete-orphan")
    ledger_entries = relationship("FinancialLedger", back_populates="user", cascade="all, delete-orphan")
    tickets = relationship("SupportTicket", back_populates="user", cascade="all, delete-orphan")


class UserBalance(Base):
    __tablename__ = "user_balances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    available_balance = Column(Float, default=0.0)
    reserved_balance = Column(Float, default=0.0)
    total_deposited = Column(Float, default=0.0)
    total_withdrawn = Column(Float, default=0.0)
    total_commission = Column(Float, default=0.0)
    total_plan_income = Column(Float, default=0.0)
    deposit_balance = Column(Float, default=0.0) # Non-withdrawable; strictly for product plan purchases
    settlement_balance = Column(Float, default=0.0) # 100% Withdrawable; earned from plan returns & commissions
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="balance")


class FinancialLedger(Base):
    __tablename__ = "financial_ledger"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False) # DEPOSIT, WITHDRAWAL_LOCK, WITHDRAWAL_PAID, WITHDRAWAL_REFUND, VIP_PURCHASE, REFERRAL_COMMISSION, DAILY_INCOME
    amount = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    reference_id = Column(String(100), nullable=True, index=True)
    description = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="ledger_entries")


class VIPProduct(Base):
    __tablename__ = "vip_products"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(Integer, unique=True, nullable=False, index=True) # 1 to 6
    name = Column(String(50), nullable=False) # Starter, Silver, Gold, Platinum, Diamond, Elite
    tag = Column(String(50), default="Popular")
    price = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False, default=30)
    daily_benefit_desc = Column(String(255), nullable=False)
    daily_income = Column(Float, default=0.0)
    total_return = Column(Float, default=0.0)
    benefits_json = Column(Text, nullable=False) # JSON array of benefits strings
    eligibility = Column(String(255), default="Open to all members")
    terms = Column(Text, default="Standard VIP Membership terms apply.")
    image_url = Column(String(255), default="")
    is_active = Column(Boolean, default=True)
    min_vip_level = Column(Integer, default=0) # 0 means all VIP levels (VIP 0+), 1 means VIP 1+, etc.
    purchase_limit = Column(Integer, default=0) # 0 means unlimited per user, >0 means max purchases per member
    total_stock = Column(Integer, default=0) # 0 means unlimited stock, >0 means limited total stock units
    sold_count = Column(Integer, default=0) # Total units purchased by users


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    vip_product_id = Column(Integer, ForeignKey("vip_products.id"), nullable=False)
    level = Column(Integer, nullable=False)
    price_paid = Column(Float, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="ACTIVE") # ACTIVE, EXPIRED, COMPLETED
    last_credit_date = Column(String(20), nullable=True) # e.g. "2026-10-14"
    days_credited = Column(Integer, default=0)
    total_income_credited = Column(Float, default=0.0)
    next_credit_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="memberships")
    product = relationship("VIPProduct")


class DepositRequest(Base):
    __tablename__ = "deposit_requests"

    id = Column(Integer, primary_key=True, index=True)
    txn_id = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    utr = Column(String(100), unique=True, nullable=False, index=True)
    screenshot_url = Column(String(255), nullable=False)
    status = Column(String(20), default="PENDING") # PENDING, APPROVED, REJECTED
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_notes = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="deposits", foreign_keys=[user_id])


class WithdrawalRequest(Base):
    __tablename__ = "withdrawal_requests"

    id = Column(Integer, primary_key=True, index=True)
    withdrawal_id = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    vip_level = Column(Integer, default=1)
    requested_amount = Column(Float, nullable=False)
    fee_amount = Column(Float, default=0.0)
    net_amount = Column(Float, nullable=False)
    payout_method_type = Column(String(20), nullable=False) # BANK, UPI
    payout_details_json = Column(Text, nullable=False) # JSON snapshot of payout account
    permitted_day = Column(String(20), nullable=False) # Monday, Tuesday...
    status = Column(String(20), default="PENDING") # PENDING, APPROVED, PAID, REJECTED, CANCELLED
    payout_reference = Column(String(100), nullable=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_notes = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="withdrawals", foreign_keys=[user_id])


class PayoutMethod(Base):
    __tablename__ = "payout_methods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(20), nullable=False) # BANK, UPI
    account_holder = Column(String(100), nullable=False)
    account_number = Column(String(50), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    bank_name = Column(String(100), nullable=True)
    upi_id = Column(String(100), nullable=True)
    is_default = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="payout_methods")


class ReferralCommission(Base):
    __tablename__ = "referral_commissions"

    id = Column(Integer, primary_key=True, index=True)
    txn_id = Column(String(50), unique=True, nullable=False, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    level = Column(Integer, nullable=False) # 1, 2, 3
    source_event = Column(String(50), default="VIP_PURCHASE")
    purchase_amount = Column(Float, nullable=False)
    rate = Column(Float, nullable=False) # 10.0, 3.0, 1.5
    commission_amount = Column(Float, nullable=False)
    status = Column(String(20), default="APPROVED") # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    referrer = relationship("User", foreign_keys=[referrer_id])
    buyer = relationship("User", foreign_keys=[buyer_id])


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    banner_url = Column(String(255), default="")
    min_vip_level = Column(Integer, default=1)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(20), default="UPCOMING") # UPCOMING, LIVE, COMPLETED, ARCHIVED
    terms = Column(Text, default="Standard event participation rules apply.")
    created_at = Column(DateTime, default=datetime.utcnow)


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    admin = relationship("User", foreign_keys=[admin_id])


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(150), nullable=False)
    category = Column(String(50), default="general") # deposit, withdrawal, vip, complaint, general
    message = Column(Text, nullable=False)
    status = Column(String(20), default="OPEN") # OPEN, IN_PROGRESS, RESOLVED
    admin_reply = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="tickets")
