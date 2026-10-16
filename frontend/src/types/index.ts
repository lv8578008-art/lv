export interface User {
  id: number;
  account_id: string;
  username?: string;
  mobile: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  referral_code: string;
  vip_level?: number;
  must_change_password: boolean;
  created_at?: string;
  active_membership?: {
    level: number;
    name: string;
    start_date: string;
    expiry_date: string;
    status: string;
    days_remaining: number;
    daily_income?: number;
    days_credited?: number;
    duration_days?: number;
    total_income_credited?: number;
    next_credit_at?: string;
  } | null;
}

export interface VIPLevelConfig {
  level: number;
  name: string;
  tag: string;
  threshold: number;
  next_threshold: number | null;
  next_level: number | null;
  withdrawal_day: string;
  task_desc: string;
}

export interface VIPProgressData {
  current_level: number;
  level_name: string;
  level_tag: string;
  total_plan_purchases: number;
  current_threshold: number;
  next_level: number | null;
  next_threshold: number | null;
  amount_needed: number;
  progress_percent: number;
  withdrawal_day: string;
  task_prompt: string;
  all_levels: VIPLevelConfig[];
}

export interface DashboardData {
  account_id: string;
  username?: string;
  mobile: string;
  role: string;
  status: string;
  referral_code: string;
  current_vip_level: number;
  current_vip_name: string;
  membership_status: string;
  membership_expiry: string | null;
  available_balance: number;
  reserved_balance: number;
  pending_deposit_amount: number;
  pending_withdrawal_amount: number;
  approved_referral_rewards: number;
  total_deposited: number;
  total_withdrawn: number;
  total_plan_purchases?: number;
  total_plan_income?: number;
  deposit_balance?: number;
  settlement_balance?: number;
  daily_settlement_info?: {
    engine_status: string;
    next_midnight_run: string;
    time_until_midnight: string;
    has_active_plan: boolean;
    daily_income_amount: number;
    days_credited: number;
    duration_days: number;
    total_earned_from_plans: number;
    today_settled: boolean;
    settlement_rule: string;
  };
  next_vip_level?: number | null;
  next_vip_threshold?: number | null;
  vip_amount_needed?: number;
  vip_progress_percent?: number;
  vip_task_prompt?: string;
  vip_progress?: VIPProgressData;
  recent_transactions: {
    id: number;
    type: string;
    amount: number;
    balance_after: number;
    reference_id: string;
    description: string;
    date: string;
  }[];
  announcements: string[];
}

export interface VIPProduct {
  id: number;
  level: number;
  name: string;
  tag: string;
  price: number;
  duration_days: number;
  daily_benefit_desc: string;
  daily_income?: number;
  total_return?: number;
  benefits: string[];
  eligibility: string;
  terms: string;
  image_url: string;
  is_active: boolean;
  is_current: boolean;
  min_vip_level?: number;
  purchase_limit?: number;
  total_stock?: number;
  sold_count?: number;
  user_purchased_count?: number;
  remaining_stock?: number | null;
  can_buy?: boolean;
  buy_disabled_reason?: string | null;
}

export interface PayoutMethod {
  id: number;
  type: 'BANK' | 'UPI';
  account_holder: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  upi_id?: string;
  is_default: boolean;
  is_verified: boolean;
}

export interface DepositRequest {
  id: number;
  txn_id: string;
  amount: number;
  utr: string;
  screenshot_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes?: string;
  reviewed_at?: string;
  created_at: string;
  account_id?: string;
  mobile?: string;
}

export interface WithdrawalRequest {
  id: number;
  withdrawal_id: string;
  user_id?: number;
  account_id?: string;
  mobile?: string;
  vip_level?: number;
  requested_amount: number;
  fee_amount: number;
  net_amount: number;
  payout_method_type: string;
  payout_details: {
    type?: string;
    account_holder?: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
    upi_id?: string;
  };
  permitted_day: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'CANCELLED';
  payout_reference?: string;
  admin_notes?: string;
  created_at: string;
}

export interface ReferralData {
  referral_code: string;
  share_link: string;
  rates: {
    level_1: number;
    level_2: number;
    level_3: number;
  };
  direct_referrals_count: number;
  level_2_count: number;
  level_3_count: number;
  eligible_transactions_count: number;
  pending_commissions: number;
  approved_commissions: number;
  total_commission_earned: number;
  recent_referrals: {
    account_id: string;
    mobile_masked: string;
    joined_date: string;
  }[];
  commissions: {
    id: number;
    txn_id: string;
    level: number;
    buyer_account_id: string;
    purchase_amount: number;
    rate: number;
    commission_amount: number;
    status: string;
    date: string;
  }[];
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  banner_url: string;
  min_vip_level: number;
  start_time: string;
  end_time: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ARCHIVED';
  terms: string;
}

export interface AdminStats {
  total_users: number;
  active_memberships: number;
  pending_deposits_count: number;
  pending_deposits_sum: number;
  pending_withdrawals_count: number;
  pending_withdrawals_sum: number;
  verified_deposits_sum: number;
  completed_withdrawals_sum: number;
  total_commission_distributed: number;
  pending_tickets_count: number;
  recent_audit_logs: {
    id: number;
    action: string;
    target: string;
    details: string;
    date: string;
  }[];
}
