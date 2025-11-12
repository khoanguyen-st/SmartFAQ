from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

def main() -> None:
    db = SessionLocal()
    try:
        user = User(
            username="admin1",
            email="admin1@example.com",
            password_hash=hash_password("StrongPass!123"),
            role="SUPER_ADMIN",
        )
        db.add(user)
        db.commit()
        print("User admin1 created.")
    finally:
        db.close()

if __name__ == "__main__":
    main()