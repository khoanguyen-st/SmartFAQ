-- Seed Test Users for SmartFAQ
-- Import this file into TablePlus or run via psql
-- All passwords are hashed with bcrypt (12 rounds)
-- Default password format: [Role]Pass123!

BEGIN;

-- Test Case 1: Admin user - Active, unlocked
-- Password: AdminPass123!
-- Note: Using email as username since schema has username field
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    is_active,
    failed_attempts,
    locked_until,
    created_at
) VALUES (
    'admin@greenwich.edu.vn',
    'admin@greenwich.edu.vn',
    '$2b$12$ahH0vZXykSFzc.I1hrAi.uuHBjojJUccyupIae8vOA7ExtWdS.wJi',  -- AdminPass123!
    'ADMIN',
    TRUE,
    0,
    NULL,
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    failed_attempts = EXCLUDED.failed_attempts,
    locked_until = EXCLUDED.locked_until;

-- Test Case 2: Staff users
-- Password: StaffPass123!
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    is_active,
    failed_attempts,
    locked_until,
    created_at
) VALUES
    ('staff1@greenwich.edu.vn', 'staff1@greenwich.edu.vn', '$2b$12$0USnxWNr1CEL/sYKnLgc6OzVclFLwxpCcnrv8UAXgaayPVOkLsQ6q', 'STAFF', TRUE, 0, NULL, NOW()),
    ('staff2@greenwich.edu.vn', 'staff2@greenwich.edu.vn', '$2b$12$0USnxWNr1CEL/sYKnLgc6OzVclFLwxpCcnrv8UAXgaayPVOkLsQ6q', 'STAFF', TRUE, 0, NULL, NOW()),
    ('staff3@greenwich.edu.vn', 'staff3@greenwich.edu.vn', '$2b$12$0USnxWNr1CEL/sYKnLgc6OzVclFLwxpCcnrv8UAXgaayPVOkLsQ6q', 'STAFF', TRUE, 0, NULL, NOW()),
    ('staff4@greenwich.edu.vn', 'staff4@greenwich.edu.vn', '$2b$12$0USnxWNr1CEL/sYKnLgc6OzVclFLwxpCcnrv8UAXgaayPVOkLsQ6q', 'STAFF', TRUE, 0, NULL, NOW())
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Test Case 3: Locked user - Account locked due to failed attempts
-- Password: LockedPass123!
-- Note: Locked when locked_until is set or failed_attempts >= 5
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    is_active,
    failed_attempts,
    locked_until,
    created_at
) VALUES (
    'locked@greenwich.edu.vn',
    'locked@greenwich.edu.vn',
    '$2b$12$imnymUmYmNgKjG7Be.TAOenX8bod.m2iQ7aIwx7HS6vHfsp9i/ZnG',  -- LockedPass123!
    'STAFF',
    TRUE,
    5,
    NOW() + INTERVAL '1 hour',  -- Locked for 1 hour
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    failed_attempts = EXCLUDED.failed_attempts,
    locked_until = EXCLUDED.locked_until;

-- Test Case 4: Temporarily locked user - Locked until future time
-- Password: TempLockedPass123!
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    is_active,
    failed_attempts,
    locked_until,
    created_at
) VALUES (
    'temp_locked@greenwich.edu.vn',
    'temp_locked@greenwich.edu.vn',
    '$2b$12$iazKUaXTkkvTDI09IWkmzeT4R/ERff/O2L8N1BKq7VyzCK0FrhyOm',  -- TempLockedPass123!
    'STAFF',
    TRUE,
    5,
    NOW() + INTERVAL '30 minutes',
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    failed_attempts = EXCLUDED.failed_attempts,
    locked_until = EXCLUDED.locked_until;

-- Test Case 5: Inactive user - Account deactivated
-- Password: InactivePass123!
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    is_active,
    failed_attempts,
    locked_until,
    created_at
) VALUES (
    'inactive@greenwich.edu.vn',
    'inactive@greenwich.edu.vn',
    '$2b$12$Pw5GjP8efNN5XJUQOaIerecYuyN3cMW41nVtd9LZHgigMoRsR.EuS',  -- InactivePass123!
    'STAFF',
    FALSE,
    0,
    NULL,
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active;

-- Test Case 6: High failed attempts - Not locked yet (3 attempts)
-- Password: AttemptsPass123!
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    is_active,
    failed_attempts,
    locked_until,
    created_at
) VALUES (
    'attempts@greenwich.edu.vn',
    'attempts@greenwich.edu.vn',
    '$2b$12$pL/HaA/BAd9CzBeO7zCCH.6/OAKuNmo1WuUyZnlShXHOb98U7l.aO',  -- AttemptsPass123!
    'STAFF',
    TRUE,
    3,
    NULL,
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    failed_attempts = EXCLUDED.failed_attempts;

-- Test Case 7: User with phone number and address
-- Password: NotifyPass123!
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    "phoneNumber",
    address,
    is_active,
    failed_attempts,
    locked_until,
    created_at
) VALUES (
    'notify@greenwich.edu.vn',
    'notify@greenwich.edu.vn',
    '$2b$12$Dgs6JjsPGhD1mgtRAkGTMu8vTFyDd6VjFKldfY3Cn1HlO8FWTCmVW',  -- NotifyPass123!
    'STAFF',
    '+84901234567',
    '123 Test Street, Ho Chi Minh City',
    TRUE,
    0,
    NULL,
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    "phoneNumber" = EXCLUDED."phoneNumber",
    address = EXCLUDED.address;

-- Test Case 8: Manager role
-- Password: ManagerPass123!
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    is_active,
    failed_attempts,
    locked_until,
    created_at
) VALUES (
    'manager@greenwich.edu.vn',
    'manager@greenwich.edu.vn',
    '$2b$12$uKM1kvBWyRDTSKD12Q4iJeJgj/1IRcuf6hJ64j8FFhZ1kYnBykdly',  -- ManagerPass123!
    'MANAGER',
    TRUE,
    0,
    NULL,
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;

-- Test Case 9: Edge case - User with maximum failed attempts but not locked
-- Password: EdgePass123!
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    is_active,
    failed_attempts,
    locked_until,
    created_at
) VALUES (
    'edge@greenwich.edu.vn',
    'edge@greenwich.edu.vn',
    '$2b$12$ujTh3DXe7g4vKRxzNIBsYONCQVDEw5gNbRKmGE.mew7xP91SugKVe',  -- EdgePass123!
    'STAFF',
    TRUE,
    4,
    NULL,
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    failed_attempts = EXCLUDED.failed_attempts;

-- Test Case 10: Expired lock - locked_until in the past (should be unlockable)
-- Password: ExpiredPass123!
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    is_active,
    failed_attempts,
    locked_until,
    created_at
) VALUES (
    'expired_lock@greenwich.edu.vn',
    'expired_lock@greenwich.edu.vn',
    '$2b$12$pGm/lgiKK4W2NimpuNWPO.vlNv2ktyvt6S/rMsO71xuG6/Oudwf8S',  -- ExpiredPass123!
    'STAFF',
    TRUE,
    5,
    NOW() - INTERVAL '1 hour',
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    failed_attempts = EXCLUDED.failed_attempts,
    locked_until = EXCLUDED.locked_until;

COMMIT;

-- Test Credentials Summary:
-- ==========================================
-- 1. admin@greenwich.edu.vn / AdminPass123! (ADMIN, Active)
-- 2. staff1@greenwich.edu.vn / StaffPass123! (STAFF, Active)
-- 3. staff2@greenwich.edu.vn / StaffPass123! (STAFF, Active)
-- 4. staff3@greenwich.edu.vn / StaffPass123! (STAFF, Active)
-- 5. staff4@greenwich.edu.vn / StaffPass123! (STAFF, Active)
-- 6. locked@greenwich.edu.vn / LockedPass123! (STAFF, LOCKED - 5 attempts, locked for 1 hour)
-- 7. temp_locked@greenwich.edu.vn / TempLockedPass123! (STAFF, TEMP LOCKED - 30 minutes)
-- 8. inactive@greenwich.edu.vn / InactivePass123! (STAFF, INACTIVE)
-- 9. attempts@greenwich.edu.vn / AttemptsPass123! (STAFF, 3 attempts - not locked)
-- 10. notify@greenwich.edu.vn / NotifyPass123! (STAFF, with phone and address)
-- 11. manager@greenwich.edu.vn / ManagerPass123! (MANAGER, Active)
-- 12. edge@greenwich.edu.vn / EdgePass123! (STAFF, 4 attempts - edge case)
-- 13. expired_lock@greenwich.edu.vn / ExpiredPass123! (STAFF, EXPIRED LOCK - can be unlocked)

