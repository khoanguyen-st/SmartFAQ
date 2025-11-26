"""Generate bcrypt password hashes for SQL import."""

import bcrypt

passwords = {
    "AdminPass123!": "admin",
    "StaffPass123!": "staff",
    "LockedPass123!": "locked",
    "TempLockedPass123!": "temp_locked",
    "InactivePass123!": "inactive",
    "AttemptsPass123!": "attempts",
    "NotifyPass123!": "notify",
    "ManagerPass123!": "manager",
    "EdgePass123!": "edge",
    "ExpiredPass123!": "expired_lock",
}

print("Password Hashes:")
print("=" * 80)
hashes = {}
for pwd, name in passwords.items():
    password_bytes = pwd.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    hash_str = hashed.decode("utf-8")
    hashes[name] = hash_str
    print(f"{name:15} {pwd:25} -> {hash_str}")

# Output for SQL file
print("\n\nSQL Hashes (copy these):")
print("=" * 80)
for name, hash_str in hashes.items():
    print(f"'{hash_str}',  -- {name}")

