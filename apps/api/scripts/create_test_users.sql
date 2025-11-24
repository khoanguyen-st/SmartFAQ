-- Test Users SQL Insert Statements
-- Run this in your database client (TablePlus, pgAdmin, etc.) or via psql

BEGIN;

-- User: admin (admin@greenwich.edu.vn)
-- Password: AdminPass123!
-- Campus: HCM
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    campus_id,
    is_active,
    is_locked,
    failed_attempts,
    locked_until,
    notification_email,
    created_at
) VALUES (
    'admin',
    'admin@greenwich.edu.vn',
    '$2b$12$myA6npA.03HPAeTF/wl00.tcHS7xrZvqiPIfr6o4weWD41OpxJXJK',
    'ADMIN',
    'HCM',
    TRUE,
    FALSE,
    0,
    NULL,
    'admin@greenwich.edu.vn',
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    campus_id = EXCLUDED.campus_id,
    notification_email = EXCLUDED.notification_email;

-- User: staff1 (staff1@greenwich.edu.vn)
-- Password: StaffPass123!
-- Campus: HCM
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    campus_id,
    is_active,
    is_locked,
    failed_attempts,
    locked_until,
    notification_email,
    created_at
) VALUES (
    'staff1',
    'staff1@greenwich.edu.vn',
    '$2b$12$lnFXi3Qp7kPDGLKBAmONQuGsoDGK5k6KR25RA51L8kmMlwcsf0OR2',
    'STAFF',
    'HCM',
    TRUE,
    FALSE,
    0,
    NULL,
    NULL,
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    campus_id = EXCLUDED.campus_id;

-- User: staff2 (staff2@greenwich.edu.vn)
-- Password: StaffPass123!
-- Campus: DN
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    campus_id,
    is_active,
    is_locked,
    failed_attempts,
    locked_until,
    notification_email,
    created_at
) VALUES (
    'staff2',
    'staff2@greenwich.edu.vn',
    '$2b$12$iPQ1LPQsQnq8o/mYVbeCVetoghMMqUkK9ZboR8IZMgrBSX8YkPJyK',
    'STAFF',
    'DN',
    TRUE,
    FALSE,
    0,
    NULL,
    NULL,
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    campus_id = EXCLUDED.campus_id;

-- User: staff3 (staff3@greenwich.edu.vn)
-- Password: StaffPass123!
-- Campus: HN
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    campus_id,
    is_active,
    is_locked,
    failed_attempts,
    locked_until,
    notification_email,
    created_at
) VALUES (
    'staff3',
    'staff3@greenwich.edu.vn',
    '$2b$12$example_hash_for_staff3',
    'STAFF',
    'HN',
    TRUE,
    FALSE,
    0,
    NULL,
    NULL,
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    campus_id = EXCLUDED.campus_id;

-- User: staff4 (staff4@greenwich.edu.vn)
-- Password: StaffPass123!
-- Campus: CT
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    campus_id,
    is_active,
    is_locked,
    failed_attempts,
    locked_until,
    notification_email,
    created_at
) VALUES (
    'staff4',
    'staff4@greenwich.edu.vn',
    '$2b$12$example_hash_for_staff4',
    'STAFF',
    'CT',
    TRUE,
    FALSE,
    0,
    NULL,
    NULL,
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    campus_id = EXCLUDED.campus_id;

-- User: locked_staff (locked@greenwich.edu.vn)
-- Password: LockedPass123!
-- Campus: HCM
-- Status: Locked (5 failed attempts)
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    campus_id,
    is_active,
    is_locked,
    failed_attempts,
    locked_until,
    notification_email,
    created_at
) VALUES (
    'locked_staff',
    'locked@greenwich.edu.vn',
    '$2b$12$m2rZp5Wxr067MftudXqIA.ZZ3adc4B09v15U5m7WDNmSAMkOkOh.u',
    'STAFF',
    'HCM',
    TRUE,
    TRUE,
    5,
    NULL,
    NULL,
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    campus_id = EXCLUDED.campus_id,
    is_locked = EXCLUDED.is_locked,
    failed_attempts = EXCLUDED.failed_attempts;

-- User: inactive_staff (inactive@greenwich.edu.vn)
-- Password: InactivePass123!
-- Campus: HCM
-- Status: Inactive
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    campus_id,
    is_active,
    is_locked,
    failed_attempts,
    locked_until,
    notification_email,
    created_at
) VALUES (
    'inactive_staff',
    'inactive@greenwich.edu.vn',
    '$2b$12$ydsbWAczUCeCLM99iDbG3OWBRh8slThyRHNkGdRF7B83bkxW2Yc7K',
    'STAFF',
    'HCM',
    FALSE,
    FALSE,
    0,
    NULL,
    NULL,
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    campus_id = EXCLUDED.campus_id,
    is_active = EXCLUDED.is_active;

-- User: high_attempts (attempts@greenwich.edu.vn)
-- Password: AttemptsPass123!
-- Campus: HN
-- Status: 3 failed attempts (not locked yet)
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    campus_id,
    is_active,
    is_locked,
    failed_attempts,
    locked_until,
    notification_email,
    created_at
) VALUES (
    'high_attempts',
    'attempts@greenwich.edu.vn',
    '$2b$12$4QtfMzQJ4LACeLpRZZVOX.eEwL0ZKKTPjdAKL7MmKrSlBmVekWhMa',
    'STAFF',
    'HN',
    TRUE,
    FALSE,
    3,
    NULL,
    NULL,
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    campus_id = EXCLUDED.campus_id,
    failed_attempts = EXCLUDED.failed_attempts;

COMMIT;

-- Test Credentials Summary:
-- ==========================================
-- 1. admin: admin@greenwich.edu.vn / AdminPass123! (HCM, ADMIN)
-- 2. staff1: staff1@greenwich.edu.vn / StaffPass123! (HCM, STAFF)
-- 3. staff2: staff2@greenwich.edu.vn / StaffPass123! (DN, STAFF)
-- 4. staff3: staff3@greenwich.edu.vn / StaffPass123! (HN, STAFF)
-- 5. staff4: staff4@greenwich.edu.vn / StaffPass123! (CT, STAFF)
-- 6. locked_staff: locked@greenwich.edu.vn / LockedPass123! (HCM, STAFF, LOCKED)
-- 7. inactive_staff: inactive@greenwich.edu.vn / InactivePass123! (HCM, STAFF, INACTIVE)
-- 8. high_attempts: attempts@greenwich.edu.vn / AttemptsPass123! (HN, STAFF, 3 attempts)