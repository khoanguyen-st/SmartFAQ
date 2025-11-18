"""Authentication endpoints (clean version)."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.users import get_current_user
from ..schemas import (
    ForgotPasswordRequest,
    LogoutResponse,
    ResetPasswordRequest,
    Token,
    UserLogin,
    UserMe,
)
from ..services.auth_service import (
    AccountLockedError,
    AuthService,
    InvalidCredentialsError,
    InvalidTokenError,
    UserNotFoundError,
    WeakPasswordError,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    service = AuthService(db)

    try:
        token = service.login(payload.email, payload.password, payload.campus_id)
    except AccountLockedError:
        raise HTTPException(423, "Account locked due to multiple failed login attempts. Please contact Super Admin.")
    except InvalidCredentialsError:
        raise HTTPException(401, "Invalid email or password.")

    return Token(access_token=token)


@router.post("/logout", response_model=LogoutResponse)
def logout(
    current_token: str = Depends(oauth2_scheme),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LogoutResponse:
    service = AuthService(db)
    service.logout(current_token)
    return LogoutResponse()


@router.get("/me", response_model=UserMe)
def get_me(current_user=Depends(get_current_user)) -> UserMe:
    """Get current user information."""
    return UserMe.model_validate(current_user)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> dict:
    service = AuthService(db)

    try:
        reset_token = service.forgot_password(payload.email)
    except UserNotFoundError:
        raise HTTPException(404, "Email not found. Please contact the Super Admin.")

    return {
        "message": "A password reset link has been sent to your registered email.",
        "reset_token": reset_token,
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> dict:
    service = AuthService(db)

    try:
        service.reset_password(payload.token, payload.new_password)
    except InvalidTokenError:
        raise HTTPException(400, "Invalid or expired reset token.")
    except WeakPasswordError:
        raise HTTPException(400, "Password does not meet security requirements.")

    return {"message": "Password reset successful."}