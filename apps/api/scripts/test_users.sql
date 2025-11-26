-- ============================================
-- Test Users for Authentication Testing
-- ============================================
-- Password for all test users: Test123!@
-- (Meets requirements: 8+ chars, uppercase, lowercase, digit, special char)
-- 
-- To generate new password hash, run:
-- docker compose exec api python scripts/generate_password_hash.py
-- ============================================

-- Clear existing test users (optional - uncomment if needed)
-- DELETE FROM users WHERE email LIKE '%@example.com';

-- ============================================
-- 1. ADMIN USER (HCM Campus) - Active, Not Locked
-- ============================================
INSERT INTO users (
    username, email, phone, address, image,
    campus, password_hash, role,
    failed_attempts, locked_until, is_locked, is_active, created_at
) VALUES (
    'admin_hcm',
    'admin@example.com',
    '0901234567',
    '123 Admin Street, Ho Chi Minh City',
    NULL,
    'HCM',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', -- Test123!@
    'ADMIN',
    0,
    NULL,
    false,
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    campus = EXCLUDED.campus,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    failed_attempts = EXCLUDED.failed_attempts,
    is_locked = EXCLUDED.is_locked,
    is_active = EXCLUDED.is_active;

-- ============================================
-- 2. STAFF USERS - Active, Not Locked (One per Campus)
-- ============================================

-- STAFF - HCM Campus
INSERT INTO users (
    username, email, phone, address, image,
    campus, password_hash, role,
    failed_attempts, locked_until, is_locked, is_active, created_at
) VALUES (
    'staff_hcm',
    'staff.hcm@example.com',
    '0901234568',
    '456 Staff Street, Ho Chi Minh City',
    NULL,
    'HCM',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', -- Test123!@
    'STAFF',
    0,
    NULL,
    false,
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    campus = EXCLUDED.campus,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    failed_attempts = EXCLUDED.failed_attempts,
    is_locked = EXCLUDED.is_locked,
    is_active = EXCLUDED.is_active;

-- STAFF - DN Campus
INSERT INTO users (
    username, email, phone, address, image,
    campus, password_hash, role,
    failed_attempts, locked_until, is_locked, is_active, created_at
) VALUES (
    'staff_dn',
    'staff.dn@example.com',
    '0901234569',
    '789 Staff Street, Da Nang',
    NULL,
    'DN',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', -- Test123!@
    'STAFF',
    0,
    NULL,
    false,
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    campus = EXCLUDED.campus,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    failed_attempts = EXCLUDED.failed_attempts,
    is_locked = EXCLUDED.is_locked,
    is_active = EXCLUDED.is_active;

-- STAFF - HN Campus
INSERT INTO users (
    username, email, phone, address, image,
    campus, password_hash, role,
    failed_attempts, locked_until, is_locked, is_active, created_at
) VALUES (
    'staff_hn',
    'staff.hn@example.com',
    '0901234570',
    '321 Staff Street, Ha Noi',
    NULL,
    'HN',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', -- Test123!@
    'STAFF',
    0,
    NULL,
    false,
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    campus = EXCLUDED.campus,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    failed_attempts = EXCLUDED.failed_attempts,
    is_locked = EXCLUDED.is_locked,
    is_active = EXCLUDED.is_active;

-- STAFF - CT Campus
INSERT INTO users (
    username, email, phone, address, image,
    campus, password_hash, role,
    failed_attempts, locked_until, is_locked, is_active, created_at
) VALUES (
    'staff_ct',
    'staff.ct@example.com',
    '0901234571',
    '654 Staff Street, Can Tho',
    NULL,
    'CT',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', -- Test123!@
    'STAFF',
    0,
    NULL,
    false,
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    campus = EXCLUDED.campus,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    failed_attempts = EXCLUDED.failed_attempts,
    is_locked = EXCLUDED.is_locked,
    is_active = EXCLUDED.is_active;

-- ============================================
-- 3. LOCKED ACCOUNT (Failed attempts >= 5)
-- ============================================
INSERT INTO users (
    username, email, phone, address, image,
    campus, password_hash, role,
    failed_attempts, locked_until, is_locked, is_active, created_at
) VALUES (
    'locked_user',
    'locked@example.com',
    '0901234572',
    '999 Locked Street',
    NULL,
    'HCM',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', -- Test123!@
    'STAFF',
    5,
    NOW(),
    true,
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    campus = EXCLUDED.campus,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    failed_attempts = EXCLUDED.failed_attempts,
    locked_until = EXCLUDED.locked_until,
    is_locked = EXCLUDED.is_locked,
    is_active = EXCLUDED.is_active;

-- ============================================
-- 4. INACTIVE ACCOUNT
-- ============================================
INSERT INTO users (
    username, email, phone, address, image,
    campus, password_hash, role,
    failed_attempts, locked_until, is_locked, is_active, created_at
) VALUES (
    'inactive_user',
    'inactive@example.com',
    '0901234573',
    '888 Inactive Street',
    NULL,
    'HCM',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', -- Test123!@
    'STAFF',
    0,
    NULL,
    false,
    false,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    campus = EXCLUDED.campus,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    failed_attempts = EXCLUDED.failed_attempts,
    is_locked = EXCLUDED.is_locked,
    is_active = EXCLUDED.is_active;

-- ============================================
-- 5. ACCOUNT WITH FAILED ATTEMPTS (But not locked yet)
-- ============================================
INSERT INTO users (
    username, email, phone, address, image,
    campus, password_hash, role,
    failed_attempts, locked_until, is_locked, is_active, created_at
) VALUES (
    'failed_attempts_user',
    'failed@example.com',
    '0901234574',
    '777 Failed Street',
    NULL,
    'HCM',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', -- Test123!@
    'STAFF',
    3,
    NULL,
    false,
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    campus = EXCLUDED.campus,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    failed_attempts = EXCLUDED.failed_attempts,
    is_locked = EXCLUDED.is_locked,
    is_active = EXCLUDED.is_active;

-- ============================================
-- Test Cases Summary:
-- ============================================
-- 1. admin@example.com / Test123!@ / HCM - ADMIN, Active, Not Locked
-- 2. staff.hcm@example.com / Test123!@ / HCM - STAFF, Active, Not Locked
-- 3. staff.dn@example.com / Test123!@ / DN - STAFF, Active, Not Locked
-- 4. staff.hn@example.com / Test123!@ / HN - STAFF, Active, Not Locked
-- 5. staff.ct@example.com / Test123!@ / CT - STAFF, Active, Not Locked
-- 6. locked@example.com / Test123!@ / HCM - STAFF, Active, LOCKED (5 failed attempts)
-- 7. inactive@example.com / Test123!@ / HCM - STAFF, INACTIVE, Not Locked
-- 8. failed@example.com / Test123!@ / HCM - STAFF, Active, Not Locked (3 failed attempts)
-- ============================================
-- 
-- Test Scenarios:
-- ============================================
-- ✅ Valid Login: Use any active user (1-5, 8)
-- ❌ Invalid Email: Use non-existent email
-- ❌ Invalid Password: Use wrong password
-- ❌ Invalid Campus: Login with wrong campus_id (e.g., staff.hcm@example.com with campus_id='DN')
-- ❌ Locked Account: locked@example.com
-- ❌ Inactive Account: inactive@example.com
-- ✅ Refresh Token: Login first, then use refresh_token
-- ✅ Logout: Login first, then logout (token will be blacklisted)
-- ============================================

