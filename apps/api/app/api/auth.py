"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..core.db import get_session
from ..core.security import (
    add_token_to_blacklist,
    create_access_token,
    create_reset_token,
    hash_password,
    validate_password_strength,
    verify_reset_token,
)
from ..core.users import get_current_user
from ..models.user import User
from ..schemas import (
    ForgotPasswordRequest,
    LogoutResponse,
    ResetPasswordRequest,
    Token,
    UserLogin,
)
from ..services.auth_service import AccountLockedError, AuthService

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_session)) -> Token:
    service = AuthService(db)

    try:
        user = service.authenticate_user(payload.username, payload.password)
    except AccountLockedError:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail={
                "error": "Account locked due to multiple failed login attempts. Please contact Super Admin."
            },
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Invalid username or password."},
        )

    token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "username": user.username,
            "role": user.role,
        },
    )
    return Token(access_token=token)


@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
async def logout(
    current_token: str = Depends(oauth2_scheme),
    current_user=Depends(get_current_user),
) -> LogoutResponse:
    add_token_to_blacklist(current_token)
    return LogoutResponse()


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_session)) -> dict:
    user: User | None = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Email not found. Please contact the Super Admin."},
        )

    reset_token = create_reset_token(user_id=user.id, email=user.email)

    # TODO: send reset_token via email to Super Admin and the user.
    return {
        "message": "Password reset link sent to your registered email.",
        "reset_token": reset_token,
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_session)) -> dict:
    token_payload = verify_reset_token(payload.token)
    if not token_payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid or expired reset token."},
        )

    user: User | None = db.query(User).filter(User.id == token_payload["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid or expired reset token."},
        )

    if not validate_password_strength(payload.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Password does not meet security requirements."},
        )

    user.password_hash = hash_password(payload.new_password)
    service = AuthService(db)
    service.reset_failed_attempts(user)
    db.commit()

    return {"message": "Password reset successful."}