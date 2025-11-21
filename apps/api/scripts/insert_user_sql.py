from sqlalchemy import text
from app.core.database import engine
from app.core.security import hash_password

def main() -> None:
    password = hash_password("StrongPass!123")
    sql = text(
        """
        INSERT INTO users (username, email, password_hash, role, is_active)
        VALUES (:username, :email, :password_hash, :role, :is_active)
        """
    )

    with engine.begin() as conn:
        conn.execute(
            sql,
            {
                "username": "admin1",
                "email": "admin1@example.com",
                "password_hash": password,
                "role": "SUPER_ADMIN",
                "is_active": True,
            },
        )
    print("Inserted user admin1.")

if __name__ == "__main__":
    main()