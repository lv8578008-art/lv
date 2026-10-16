from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- AUTH SCHEMAS ---

class UserRegister(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=30, description="Display username")
    mobile: str = Field(..., description="Indian 10-digit mobile number")
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    confirm_password: str
    referral_code: Optional[str] = None
    verification_code: Optional[str] = None

    @field_validator("mobile")
    def validate_mobile(cls, v: str) -> str:
        clean = v.strip().replace("+91", "").replace(" ", "").replace("-", "")
        if not (len(clean) == 10 and clean.isdigit() and clean[0] in "6789"):
            raise ValueError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.")
        return clean


class UserLogin(BaseModel):
    mobile: str
    password: str
    remember_device: Optional[bool] = False


class ForgotPasswordRequest(BaseModel):
    mobile: str
    recovery_token: str
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str


class AdminPasswordChange(BaseModel):
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str


# --- USER / DASHBOARD SCHEMAS ---

class ActiveMembershipOut(BaseModel):
    level: int
    name: str
    start_date: datetime
    expiry_date: datetime
    status: str
    days_remaining: int
    daily_income: float = 0.0
    days_credited: int = 0
    duration_days: int = 30
    total_income_credited: float = 0.0
    next_credit_at: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    account_id: str
    username: Optional[str] = None
    mobile: str
    role: str
    status: str
    referral_code: str
    must_change_password: bool
    vip_level: int = 0
    created_at: datetime
    active_membership: Optional[ActiveMembershipOut] = None

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    account_id: str
    username: Optional[str] = None
    mobile: str
    role: str
    status: str
    referral_code: str
    current_vip_level: int
    current_vip_name: str
    membership_status: str
    membership_expiry: Optional[datetime]
    available_balance: float
    reserved_balance: float
    pending_deposit_amount: float
    pending_withdrawal_amount: float
    approved_referral_rewards: float
    total_deposited: float
    total_withdrawn: float
    total_plan_purchases: float = 0.0
    total_plan_income: float = 0.0
    deposit_balance: float = 0.0
    settlement_balance: float = 0.0
    daily_settlement_info: Optional[Dict[str, Any]] = None
    next_vip_level: Optional[int] = None
    next_vip_threshold: Optional[float] = None
    vip_amount_needed: float = 0.0
    vip_progress_percent: float = 0.0
    vip_task_prompt: str = ""
    vip_progress: Optional[Dict[str, Any]] = None
    recent_transactions: List[Dict[str, Any]]
    announcements: List[str]


# --- VIP PRODUCTS SCHEMAS ---

class VIPProductOut(BaseModel):
    id: int
    level: int
    name: str
    tag: str
    price: float
    duration_days: int
    daily_benefit_desc: str
    daily_income: float = 0.0
    total_return: float = 0.0
    benefits: List[str]
    eligibility: str
    terms: str
    image_url: str
    is_active: bool
    is_current: bool = False
    min_vip_level: int = 0
    purchase_limit: int = 0 # 0 means unlimited
    total_stock: int = 0 # 0 means unlimited
    sold_count: int = 0
    user_purchased_count: int = 0
    remaining_stock: Optional[int] = None
    can_buy: bool = True
    buy_disabled_reason: Optional[str] = None


class VIPBuyRequest(BaseModel):
    product_id: int


class VIPProductUpdate(BaseModel):
    name: Optional[str] = None
    tag: Optional[str] = None
    price: Optional[float] = None
    duration_days: Optional[int] = None
    daily_benefit_desc: Optional[str] = None
    daily_income: Optional[float] = None
    total_return: Optional[float] = None
    image_url: Optional[str] = None
    benefits: Optional[List[str]] = None
    eligibility: Optional[str] = None
    terms: Optional[str] = None
    is_active: Optional[bool] = None
    min_vip_level: Optional[int] = None
    purchase_limit: Optional[int] = None
    total_stock: Optional[int] = None


class VIPProductCreate(BaseModel):
    name: str
    level: Optional[int] = None
    tag: Optional[str] = "Popular"
    price: float
    duration_days: int = 30
    daily_income: float = 0.0
    total_return: Optional[float] = None
    image_url: Optional[str] = ""
    daily_benefit_desc: Optional[str] = None
    benefits: Optional[List[str]] = None
    eligibility: Optional[str] = "Open to all members"
    terms: Optional[str] = "Standard VIP Membership terms apply."
    is_active: bool = True
    min_vip_level: Optional[int] = 0
    purchase_limit: Optional[int] = 0
    total_stock: Optional[int] = 0


# --- DEPOSIT SCHEMAS ---

class DepositCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Deposit amount in INR")
    utr: str = Field(..., min_length=6, max_length=50, description="Payment UTR/Reference number")
    screenshot_url: str = Field(..., description="Uploaded payment proof URL")


class DepositOut(BaseModel):
    id: int
    txn_id: str
    amount: float
    utr: str
    screenshot_url: str
    status: str
    admin_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class DepositDecision(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|REJECTED)$")
    admin_notes: Optional[str] = None


# --- WITHDRAWAL SCHEMAS ---

class PayoutMethodCreate(BaseModel):
    type: str = Field(..., pattern="^(BANK|UPI)$")
    account_holder: str
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None
    upi_id: Optional[str] = None


class PayoutMethodOut(BaseModel):
    id: int
    type: str
    account_holder: str
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None
    upi_id: Optional[str] = None
    is_default: bool
    is_verified: bool

    class Config:
        from_attributes = True


class WithdrawalCreate(BaseModel):
    amount: float = Field(..., ge=199, le=99999)
    payout_method_id: int


class WithdrawalOut(BaseModel):
    id: int
    withdrawal_id: str
    requested_amount: float
    fee_amount: float
    net_amount: float
    payout_method_type: str
    payout_details: Dict[str, Any]
    permitted_day: str
    status: str
    payout_reference: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime


class WithdrawalDecision(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|PAID|REJECTED)$")
    payout_reference: Optional[str] = None
    admin_notes: Optional[str] = None


# --- REFERRAL SCHEMAS ---

class ReferralDashboardOut(BaseModel):
    referral_code: str
    share_link: str
    rates: Dict[str, float]
    direct_referrals_count: int  # L1
    level_2_count: int           # L2
    level_3_count: int           # L3
    eligible_transactions_count: int
    pending_commissions: float
    approved_commissions: float
    total_commission_earned: float
    recent_referrals: List[Dict[str, Any]]
    commissions: List[Dict[str, Any]]


# --- EVENTS SCHEMAS ---

class EventOut(BaseModel):
    id: int
    title: str
    description: str
    banner_url: str
    min_vip_level: int
    start_time: datetime
    end_time: datetime
    status: str
    terms: str
    created_at: datetime

    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    title: str
    description: str
    banner_url: Optional[str] = ""
    min_vip_level: int = 1
    start_time: datetime
    end_time: datetime
    status: Optional[str] = "UPCOMING"
    terms: Optional[str] = "Standard event terms and conditions apply."


# --- SUPPORT TICKET SCHEMAS ---

class TicketCreate(BaseModel):
    subject: str
    category: str = "general"
    message: str


class TicketReply(BaseModel):
    reply: str
    status: str = "RESOLVED"
