"""Generate bcrypt password hash for test users."""

import bcrypt


def hash_password(password: str) -> str:
    """Hash password using bcrypt (12 rounds)."""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


if __name__ == "__main__":
    password = "Test123!@"
    hashed = hash_password(password)
    print(f"Password: {password}")
    print(f"Hash: {hashed}")
    print(f"\nSQL INSERT example:")
    print(f"password_hash = '{hashed}'")

