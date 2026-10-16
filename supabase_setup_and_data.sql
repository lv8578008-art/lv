-- ==============================================================================
-- VIP REWARDS & MEMBERSHIP PLATFORM - SUPABASE SCHEMA & COMPLETE DATA MIGRATION
-- ==============================================================================
-- Run this entire script in Supabase Dashboard > SQL Editor > New Query > Run
-- Project ID: cbgztsoxlbhqqtyctgkc
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(50) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- 2. USER BALANCES
CREATE TABLE IF NOT EXISTS user_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available_balance NUMERIC(14, 2) DEFAULT 0.00,
    reserved_balance NUMERIC(14, 2) DEFAULT 0.00,
    total_deposited NUMERIC(14, 2) DEFAULT 0.00,
    total_withdrawn NUMERIC(14, 2) DEFAULT 0.00,
    total_commission NUMERIC(14, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. FINANCIAL LEDGER
CREATE TABLE IF NOT EXISTS financial_ledger (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    balance_after NUMERIC(14, 2) NOT NULL,
    reference_id VARCHAR(100),
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON financial_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON financial_ledger(type);

-- 4. VIP PRODUCTS
CREATE TABLE IF NOT EXISTS vip_products (
    id SERIAL PRIMARY KEY,
    level INTEGER UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    tag VARCHAR(50) DEFAULT 'Popular',
    price NUMERIC(14, 2) NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 30,
    daily_benefit_desc VARCHAR(255) NOT NULL,
    benefits_json TEXT NOT NULL,
    eligibility VARCHAR(255) DEFAULT 'Open to all members',
    terms TEXT DEFAULT 'Standard VIP Membership terms apply.',
    image_url VARCHAR(255) DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. MEMBERSHIPS
CREATE TABLE IF NOT EXISTS memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vip_product_id INTEGER NOT NULL REFERENCES vip_products(id) ON DELETE RESTRICT,
    level INTEGER NOT NULL,
    price_paid NUMERIC(14, 2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. DEPOSIT REQUESTS
CREATE TABLE IF NOT EXISTS deposit_requests (
    id SERIAL PRIMARY KEY,
    txn_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL,
    utr VARCHAR(100) UNIQUE NOT NULL,
    screenshot_url VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_notes VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. WITHDRAWAL REQUESTS
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id SERIAL PRIMARY KEY,
    withdrawal_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vip_level INTEGER DEFAULT 1,
    requested_amount NUMERIC(14, 2) NOT NULL,
    fee_amount NUMERIC(14, 2) DEFAULT 0.00,
    net_amount NUMERIC(14, 2) NOT NULL,
    payout_method_type VARCHAR(20) NOT NULL,
    payout_details_json TEXT NOT NULL,
    permitted_day VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    payout_reference VARCHAR(100),
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_notes VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. PAYOUT METHODS
CREATE TABLE IF NOT EXISTS payout_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    account_holder VARCHAR(100) NOT NULL,
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    bank_name VARCHAR(100),
    upi_id VARCHAR(100),
    is_default BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. REFERRAL COMMISSIONS
CREATE TABLE IF NOT EXISTS referral_commissions (
    id SERIAL PRIMARY KEY,
    txn_id VARCHAR(50) UNIQUE NOT NULL,
    referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    source_event VARCHAR(50) DEFAULT 'VIP_PURCHASE',
    purchase_amount NUMERIC(14, 2) NOT NULL,
    rate NUMERIC(6, 2) NOT NULL,
    commission_amount NUMERIC(14, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. EVENTS
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    banner_url VARCHAR(255) DEFAULT '',
    min_vip_level INTEGER DEFAULT 1,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'UPCOMING',
    terms TEXT DEFAULT 'Standard event participation rules apply.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS platform_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 13. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ==============================================================================
-- DATA INSERTION (MIGRATED FROM LOCAL SQLITE)
-- ==============================================================================

-- Table: users (5 records)
INSERT INTO users (id, account_id, mobile, hashed_password, role, status, referral_code, referred_by_id, must_change_password, created_at, updated_at) VALUES (1, 'ADM-000001', 'admin', '$2b$12$/hAAhh6rSQWtCRWmO7r/m.8AdGg7bPkAqzVp8.ViyIl3Lu3yTeTnS', 'admin', 'active', 'ADMINVIP', NULL, False, '2026-10-10 09:46:23.550455', '2026-10-10 10:44:09.167430') ON CONFLICT DO NOTHING;
INSERT INTO users (id, account_id, mobile, hashed_password, role, status, referral_code, referred_by_id, must_change_password, created_at, updated_at) VALUES (2, 'VIP-528908', '9876525719', '$2b$12$xfrKieFxCs9HFgENps6nqu2wKG/jMu3t3ZrAbOSv0y/qVsxq9cQzG', 'user', 'active', 'ZEHHOYL', 1, False, '2026-10-10 09:48:39.873933', '2026-10-10 09:48:39.873939') ON CONFLICT DO NOTHING;
INSERT INTO users (id, account_id, mobile, hashed_password, role, status, referral_code, referred_by_id, must_change_password, created_at, updated_at) VALUES (3, 'VIP-942727', '9876525789', '$2b$12$Q/hAZA8PuAmLBhIlKhvpyO4uyowib7SjZiMO8ODolPLPlorvWKCMa', 'user', 'active', 'RPQTRLU', 1, False, '2026-10-10 09:49:49.253423', '2026-10-10 09:49:49.253428') ON CONFLICT DO NOTHING;
INSERT INTO users (id, account_id, mobile, hashed_password, role, status, referral_code, referred_by_id, must_change_password, created_at, updated_at) VALUES (4, 'VIP-298157', '9187887874', '$2b$12$UvFRcD2/Lgc/S3FrMsx.sOFH.YayI7n5r8C0h/pwjIv2KrvIVkikC', 'user', 'active', '4Z176OG', NULL, False, '2026-10-10 10:11:34.301976', '2026-10-10 10:11:34.301984') ON CONFLICT DO NOTHING;
INSERT INTO users (id, account_id, mobile, hashed_password, role, status, referral_code, referred_by_id, must_change_password, created_at, updated_at) VALUES (5, 'VIP-426384', '9876527432', '$2b$12$A2BITpqD9A9Q7ZgJoJlsHOV613M8zQk.rkHgQYb.I7vkXHmLA7MmS', 'user', 'active', 'KTSMDOE', 1, False, '2026-10-10 10:17:13.069352', '2026-10-10 10:17:13.069358') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));

-- Table: user_balances (5 records)
INSERT INTO user_balances (id, user_id, available_balance, reserved_balance, total_deposited, total_withdrawn, total_commission, updated_at) VALUES (1, 1, 1000100.0, 0.0, 0.0, 0.0, 100.0, '2026-10-10 10:17:13.147140') ON CONFLICT DO NOTHING;
INSERT INTO user_balances (id, user_id, available_balance, reserved_balance, total_deposited, total_withdrawn, total_commission, updated_at) VALUES (2, 2, 2000.0, 0.0, 2000.0, 0.0, 0.0, '2026-10-10 09:48:39.986509') ON CONFLICT DO NOTHING;
INSERT INTO user_balances (id, user_id, available_balance, reserved_balance, total_deposited, total_withdrawn, total_commission, updated_at) VALUES (3, 3, 1000.0, 0.0, 2000.0, 500.0, 0.0, '2026-10-10 09:49:49.410049') ON CONFLICT DO NOTHING;
INSERT INTO user_balances (id, user_id, available_balance, reserved_balance, total_deposited, total_withdrawn, total_commission, updated_at) VALUES (4, 4, 0.0, 0.0, 0.0, 0.0, 0.0, '2026-10-10 10:11:34.314390') ON CONFLICT DO NOTHING;
INSERT INTO user_balances (id, user_id, available_balance, reserved_balance, total_deposited, total_withdrawn, total_commission, updated_at) VALUES (5, 5, 1000.0, 0.0, 2000.0, 500.0, 0.0, '2026-10-10 10:17:13.245952') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('user_balances', 'id'), COALESCE((SELECT MAX(id) FROM user_balances), 1));

-- Table: vip_products (6 records)
INSERT INTO vip_products (id, level, name, tag, price, duration_days, daily_benefit_desc, benefits_json, eligibility, terms, image_url, is_active) VALUES (1, 1, 'Starter', 'Entry Level', 500.0, 30, '₹25 Daily Rewards Credit', '["Weekly Saturday Withdrawals", "10% Direct Referral Commission", "24/7 Mobile Support", "Digital Membership Certificate"]', 'Open to all verified mobile members', 'Valid for 30 calendar days from activation. Non-refundable once activated.', 'starter_badge', True) ON CONFLICT DO NOTHING;
INSERT INTO vip_products (id, level, name, tag, price, duration_days, daily_benefit_desc, benefits_json, eligibility, terms, image_url, is_active) VALUES (2, 2, 'Silver', 'Most Popular', 1500.0, 45, '₹85 Daily Rewards Credit', '["Weekly Friday Withdrawals", "Access to Silver Member Lucky Draw", "3-Tier Referral Tier Access", "Dedicated Helpdesk Support"]', 'Requires active account verification', 'Valid for 45 calendar days from activation. Standard terms apply.', 'silver_badge', True) ON CONFLICT DO NOTHING;
INSERT INTO vip_products (id, level, name, tag, price, duration_days, daily_benefit_desc, benefits_json, eligibility, terms, image_url, is_active) VALUES (3, 3, 'Gold', 'High Yield', 5000.0, 60, '₹300 Daily Rewards Credit', '["Weekly Thursday Withdrawals", "Priority Fast-Track Deposits", "Exclusive Gold Community Access", "Quarterly Cash Bonus Eligibility"]', 'Open to all members', 'Valid for 60 calendar days from activation.', 'gold_badge', True) ON CONFLICT DO NOTHING;
INSERT INTO vip_products (id, level, name, tag, price, duration_days, daily_benefit_desc, benefits_json, eligibility, terms, image_url, is_active) VALUES (4, 4, 'Platinum', 'Executive', 15000.0, 90, '₹1,000 Daily Rewards Credit', '["Weekly Wednesday Withdrawals", "Personal Concierge Support", "Zero-Fee Express Settlement", "VIP Merchandise Package"]', 'Eligible for all members', 'Valid for 90 calendar days from activation.', 'platinum_badge', True) ON CONFLICT DO NOTHING;
INSERT INTO vip_products (id, level, name, tag, price, duration_days, daily_benefit_desc, benefits_json, eligibility, terms, image_url, is_active) VALUES (5, 5, 'Diamond', 'Prestige', 50000.0, 120, '₹3,600 Daily Rewards Credit', '["Weekly Tuesday Withdrawals", "Dedicated Account Manager", "Diamond Event Invitations", "Maximum Daily Limits"]', 'Prestige tier verification', 'Valid for 120 calendar days from activation.', 'diamond_badge', True) ON CONFLICT DO NOTHING;
INSERT INTO vip_products (id, level, name, tag, price, duration_days, daily_benefit_desc, benefits_json, eligibility, terms, image_url, is_active) VALUES (6, 6, 'Elite', 'Supreme', 150000.0, 180, '₹12,000 Daily Rewards Credit', '["Weekly Monday Withdrawals", "VIP Director Direct Line", "Private Annual Gala Invitation", "Supreme Tier Commission Perks"]', 'Supreme tier invitation and open enrollment', 'Valid for 180 calendar days from activation.', 'elite_badge', True) ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('vip_products', 'id'), COALESCE((SELECT MAX(id) FROM vip_products), 1));

-- Table: events (3 records)
INSERT INTO events (id, title, description, banner_url, min_vip_level, start_time, end_time, status, terms, created_at) VALUES (1, 'Super Weekend Referral Bonus Fest', 'Earn an extra 5% booster on all direct Level 1 VIP product activations this weekend! Top 3 referrers receive special milestone reward hampers.', '', 1, '2026-10-09 09:46:23.560221', '2026-10-13 09:46:23.560235', 'LIVE', 'Valid for all verified members holding an active VIP 1 or higher membership.', '2026-10-10 09:46:23.564512') ON CONFLICT DO NOTHING;
INSERT INTO events (id, title, description, banner_url, min_vip_level, start_time, end_time, status, terms, created_at) VALUES (2, 'Annual Diamond & Elite Gala Celebration', 'Exclusive annual networking banquet and honors night for Diamond and Elite tier holders in New Delhi. Travel & luxury stay credits included.', '', 5, '2026-10-22 09:46:23.560240', '2026-10-24 09:46:23.560243', 'UPCOMING', 'RSVP required by Diamond & Elite pass holders.', '2026-10-10 09:46:23.564515') ON CONFLICT DO NOTHING;
INSERT INTO events (id, title, description, banner_url, min_vip_level, start_time, end_time, status, terms, created_at) VALUES (3, 'Diwali Prosperity Mega Draw', 'Grand festive draw featuring gold bars, premium smartphones, and instant wallet credits for active members across all 6 VIP levels.', '', 1, '2026-10-30 09:46:23.560247', '2026-11-04 09:46:23.560251', 'UPCOMING', '1 raffle ticket per VIP membership held during the promotion window.', '2026-10-10 09:46:23.564516') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE((SELECT MAX(id) FROM events), 1));

-- Table: platform_settings (11 records)
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('upi_id', 'vippay@oksbi', 'Official UPI address for manual deposits', '2026-10-10 09:46:23.565644') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('qr_code_url', 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=vippay@oksbi&pn=VIP%20Rewards&cu=INR', 'QR Code image URL for payment', '2026-10-10 09:46:23.565647') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('min_withdrawal', '199', 'Minimum allowable withdrawal amount in INR', '2026-10-10 09:46:23.565648') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('max_withdrawal', '99999', 'Maximum allowable withdrawal amount per request in INR', '2026-10-10 09:46:23.565649') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('ref_l1_rate', '10.0', 'Level 1 referral commission percentage', '2026-10-10 09:46:23.565650') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('ref_l2_rate', '3.0', 'Level 2 referral commission percentage', '2026-10-10 09:46:23.565651') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('ref_l3_rate', '1.5', 'Level 3 referral commission percentage', '2026-10-10 09:46:23.565652') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('withdrawal_fee_percent', '0', 'Withdrawal processing fee in percent', '2026-10-10 09:46:23.565653') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('test_mode', 'true', 'Test mode toggle to bypass day restrictions if needed', '2026-10-10 10:17:13.180122') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('deposit_instructions', 'Please transfer the exact amount via UPI to the verified VPA above. Save the 12-digit UTR/Reference number from your banking app and submit the screenshot below for instant verification.', 'Instructions displayed on deposit page', '2026-10-10 09:46:23.565655') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value, description, updated_at) VALUES ('announcements', '[''Welcome to VIP Rewards Club! Experience elite membership rewards, weekly scheduled payouts, and a lucrative 3-tier affiliate network.'', ''Maintenance notice: Routine payment gateway reconciliation occurs daily between 23:00 - 23:30 IST.'']', 'System announcements JSON', '2026-10-10 09:46:23.565656') ON CONFLICT DO NOTHING;
-- Table: memberships (2 records)
INSERT INTO memberships (id, user_id, vip_product_id, level, price_paid, start_date, expiry_date, status, created_at) VALUES (1, 3, 1, 1, 500.0, '2026-10-10 09:49:49.316196', '2026-11-09 09:49:49.316196', 'ACTIVE', '2026-10-10 09:49:49.322833') ON CONFLICT DO NOTHING;
INSERT INTO memberships (id, user_id, vip_product_id, level, price_paid, start_date, expiry_date, status, created_at) VALUES (2, 5, 1, 1, 500.0, '2026-10-10 10:17:13.143855', '2026-11-09 10:17:13.143855', 'ACTIVE', '2026-10-10 10:17:13.149809') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('memberships', 'id'), COALESCE((SELECT MAX(id) FROM memberships), 1));

-- Table: deposit_requests (3 records)
INSERT INTO deposit_requests (id, txn_id, user_id, amount, utr, screenshot_url, status, admin_id, admin_notes, reviewed_at, created_at) VALUES (1, 'DEP-FC3A2FB5', 2, 2000.0, 'UTR1791625719', '/api/uploads/sample.jpg', 'APPROVED', 1, 'Verified via SBI statement', '2026-10-10 09:48:39.984278', '2026-10-10 09:48:39.938891') ON CONFLICT DO NOTHING;
INSERT INTO deposit_requests (id, txn_id, user_id, amount, utr, screenshot_url, status, admin_id, admin_notes, reviewed_at, created_at) VALUES (2, 'DEP-F6F4F697', 3, 2000.0, 'UTR1791625789', '/api/uploads/sample.jpg', 'APPROVED', 1, 'Verified via SBI statement', '2026-10-10 09:49:49.290677', '2026-10-10 09:49:49.277242') ON CONFLICT DO NOTHING;
INSERT INTO deposit_requests (id, txn_id, user_id, amount, utr, screenshot_url, status, admin_id, admin_notes, reviewed_at, created_at) VALUES (3, 'DEP-CCA1D7F3', 5, 2000.0, 'UTR1791627433', '/api/uploads/sample.jpg', 'APPROVED', 1, 'Verified via SBI statement', '2026-10-10 10:17:13.114714', '2026-10-10 10:17:13.098796') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('deposit_requests', 'id'), COALESCE((SELECT MAX(id) FROM deposit_requests), 1));

-- Table: withdrawal_requests (2 records)
INSERT INTO withdrawal_requests (id, withdrawal_id, user_id, vip_level, requested_amount, fee_amount, net_amount, payout_method_type, payout_details_json, permitted_day, status, payout_reference, admin_id, admin_notes, reviewed_at, created_at) VALUES (1, 'WTH-BC7A601A', 3, 1, 500.0, 0.0, 500.0, 'BANK', '{"type": "BANK", "account_holder": "VIP Tester", "account_number": "123456789012", "ifsc_code": "SBIN0001234", "bank_name": "State Bank of India", "upi_id": null}', 'Saturday', 'PAID', 'IMPS88371920', 1, 'Processed via Corporate NetBanking', '2026-10-10 09:49:49.410033', '2026-10-10 09:49:49.383509') ON CONFLICT DO NOTHING;
INSERT INTO withdrawal_requests (id, withdrawal_id, user_id, vip_level, requested_amount, fee_amount, net_amount, payout_method_type, payout_details_json, permitted_day, status, payout_reference, admin_id, admin_notes, reviewed_at, created_at) VALUES (2, 'WTH-A4CDF2CA', 5, 1, 500.0, 0.0, 500.0, 'BANK', '{"type": "BANK", "account_holder": "VIP Tester", "account_number": "123456789012", "ifsc_code": "SBIN0001234", "bank_name": "State Bank of India", "upi_id": null}', 'Saturday', 'PAID', 'IMPS88371920', 1, 'Processed via Corporate NetBanking', '2026-10-10 10:17:13.245928', '2026-10-10 10:17:13.216804') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('withdrawal_requests', 'id'), COALESCE((SELECT MAX(id) FROM withdrawal_requests), 1));

-- Table: payout_methods (2 records)
INSERT INTO payout_methods (id, user_id, type, account_holder, account_number, ifsc_code, bank_name, upi_id, is_default, is_verified, created_at) VALUES (1, 3, 'BANK', 'VIP Tester', '123456789012', 'SBIN0001234', 'State Bank of India', NULL, True, True, '2026-10-10 09:49:49.362492') ON CONFLICT DO NOTHING;
INSERT INTO payout_methods (id, user_id, type, account_holder, account_number, ifsc_code, bank_name, upi_id, is_default, is_verified, created_at) VALUES (2, 5, 'BANK', 'VIP Tester', '123456789012', 'SBIN0001234', 'State Bank of India', NULL, True, True, '2026-10-10 10:17:13.195925') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('payout_methods', 'id'), COALESCE((SELECT MAX(id) FROM payout_methods), 1));

-- Table: referral_commissions (2 records)
INSERT INTO referral_commissions (id, txn_id, referrer_id, buyer_id, level, source_event, purchase_amount, rate, commission_amount, status, created_at) VALUES (1, 'REF-58E702AE', 1, 3, 1, 'VIP_PURCHASE', 500.0, 10.0, 50.0, 'APPROVED', '2026-10-10 09:49:49.323826') ON CONFLICT DO NOTHING;
INSERT INTO referral_commissions (id, txn_id, referrer_id, buyer_id, level, source_event, purchase_amount, rate, commission_amount, status, created_at) VALUES (2, 'REF-D03ECD2C', 1, 5, 1, 'VIP_PURCHASE', 500.0, 10.0, 50.0, 'APPROVED', '2026-10-10 10:17:13.150332') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('referral_commissions', 'id'), COALESCE((SELECT MAX(id) FROM referral_commissions), 1));

-- Table: audit_logs (10 records)
INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (1, 1, 'ADMIN_PASSWORD_CHANGE', 'User', '1', 'Superadmin changed password and rotated initial setup credential', '2026-10-10 09:48:39.232106') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (2, 1, 'DEPOSIT_APPROVED', 'DepositRequest', '1', 'APPROVED deposit DEP-FC3A2FB5 of ₹2,000.00 for user #2. Note: Verified via SBI statement', '2026-10-10 09:48:39.987474') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (3, 1, 'ADMIN_PASSWORD_CHANGE', 'User', '1', 'Superadmin changed password and rotated initial setup credential', '2026-10-10 09:49:49.006604') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (4, 1, 'DEPOSIT_APPROVED', 'DepositRequest', '2', 'APPROVED deposit DEP-F6F4F697 of ₹2,000.00 for user #3. Note: Verified via SBI statement', '2026-10-10 09:49:49.291644') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (5, 1, 'UPDATE_SETTINGS', 'PlatformSetting', 'global', 'Updated keys: test_mode', '2026-10-10 09:49:49.347703') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (6, 1, 'WITHDRAWAL_PAID', 'WithdrawalRequest', '1', 'PAID withdrawal WTH-BC7A601A (₹500.0). Ref: IMPS88371920', '2026-10-10 09:49:49.410620') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (7, 1, 'ADMIN_PASSWORD_CHANGE', 'User', '1', 'Superadmin changed password and rotated initial setup credential', '2026-10-10 10:17:12.711352') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (8, 1, 'DEPOSIT_APPROVED', 'DepositRequest', '3', 'APPROVED deposit DEP-CCA1D7F3 of ₹2,000.00 for user #5. Note: Verified via SBI statement', '2026-10-10 10:17:13.116289') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (9, 1, 'UPDATE_SETTINGS', 'PlatformSetting', 'global', 'Updated keys: test_mode', '2026-10-10 10:17:13.180578') ON CONFLICT DO NOTHING;
INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (10, 1, 'WITHDRAWAL_PAID', 'WithdrawalRequest', '2', 'PAID withdrawal WTH-A4CDF2CA (₹500.0). Ref: IMPS88371920', '2026-10-10 10:17:13.246695') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('audit_logs', 'id'), COALESCE((SELECT MAX(id) FROM audit_logs), 1));

-- Table: financial_ledger (11 records)
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (1, 2, 'DEPOSIT', 2000.0, 2000.0, 'DEP-FC3A2FB5', 'Verified deposit credit via UTR: UTR1791625719', '2026-10-10 09:48:39.991323') ON CONFLICT DO NOTHING;
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (2, 3, 'DEPOSIT', 2000.0, 2000.0, 'DEP-F6F4F697', 'Verified deposit credit via UTR: UTR1791625789', '2026-10-10 09:49:49.293231') ON CONFLICT DO NOTHING;
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (3, 3, 'VIP_PURCHASE', -500.0, 1500.0, 'VIP-A40C8704', 'Purchased VIP Level 1 (Starter) membership for 30 days.', '2026-10-10 09:49:49.321228') ON CONFLICT DO NOTHING;
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (4, 1, 'REFERRAL_COMMISSION', 50.0, 1000050.0, 'REF-58E702AE', 'Level 1 Referral Bonus (10.0%) from user VIP-942727''s VIP 1 purchase.', '2026-10-10 09:49:49.321231') ON CONFLICT DO NOTHING;
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (5, 3, 'WITHDRAWAL_LOCK', -500.0, 1000.0, 'WTH-BC7A601A', 'Locked funds for withdrawal request WTH-BC7A601A (Net payable: ₹500.00).', '2026-10-10 09:49:49.381536') ON CONFLICT DO NOTHING;
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (6, 3, 'WITHDRAWAL_PAID', -500.0, 1000.0, 'WTH-BC7A601A', 'Paid withdrawal WTH-BC7A601A. Bank Ref: IMPS88371920', '2026-10-10 09:49:49.411674') ON CONFLICT DO NOTHING;
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (7, 5, 'DEPOSIT', 2000.0, 2000.0, 'DEP-CCA1D7F3', 'Verified deposit credit via UTR: UTR1791627433', '2026-10-10 10:17:13.117982') ON CONFLICT DO NOTHING;
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (8, 5, 'VIP_PURCHASE', -500.0, 1500.0, 'VIP-28007A0B', 'Purchased VIP Level 1 (Starter) membership for 30 days.', '2026-10-10 10:17:13.148129') ON CONFLICT DO NOTHING;
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (9, 1, 'REFERRAL_COMMISSION', 50.0, 1000100.0, 'REF-D03ECD2C', 'Level 1 Referral Bonus (10.0%) from user VIP-426384''s VIP 1 purchase.', '2026-10-10 10:17:13.148134') ON CONFLICT DO NOTHING;
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (10, 5, 'WITHDRAWAL_LOCK', -500.0, 1000.0, 'WTH-A4CDF2CA', 'Locked funds for withdrawal request WTH-A4CDF2CA (Net payable: ₹500.00).', '2026-10-10 10:17:13.214949') ON CONFLICT DO NOTHING;
INSERT INTO financial_ledger (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (11, 5, 'WITHDRAWAL_PAID', -500.0, 1000.0, 'WTH-A4CDF2CA', 'Paid withdrawal WTH-A4CDF2CA. Bank Ref: IMPS88371920', '2026-10-10 10:17:13.247958') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('financial_ledger', 'id'), COALESCE((SELECT MAX(id) FROM financial_ledger), 1));
