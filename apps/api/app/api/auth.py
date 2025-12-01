from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.dependency import get_current_user
from ..models.user import User
from ..schemas import (
    ForgotPasswordRequest,
    LogoutResponse,
    RefreshTokenRequest,
    ResetPasswordRequest,
    Token,
    UserLogin,
    UserMe,
)
from ..services.auth_service import (
    AccountLockedError,
    AuthService,
    InactiveAccountError,
    InvalidCampusError,
    InvalidPasswordError,
    InvalidTokenError,
    SamePasswordError,
    UserNotFoundError,
    WeakPasswordError,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)) -> Token:
    service = AuthService(db)
    try:
        access_token, refresh_token = await service.login(
            payload.email, payload.password, payload.campus_id
        )
    except AccountLockedError:
        raise HTTPException(
            status_code=423,
            detail={
                "error": "Account locked due to multiple failed login attempts. Please contact Administrator."
            },
        )
    except InactiveAccountError:
        raise HTTPException(
            status_code=403, detail={"error": "Account is inactive. Please contact administrator."}
        )
    except UserNotFoundError:
        raise HTTPException(
            status_code=404, detail={"error": "Email not found. Please check your email address."}
        )
    except InvalidCampusError:
        raise HTTPException(
            status_code=401, detail={"error": "You do not have access to this campus"}
        )
    except InvalidPasswordError:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid password. Please check your password and try again."},
        )
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh_token(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)) -> Token:
    service = AuthService(db)
    try:
        access_token = await service.refresh_access_token(payload.refresh_token)
    except InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid or expired refresh token. Please login again."},
        )
    except InactiveAccountError:
        raise HTTPException(
            status_code=403, detail={"error": "Account is inactive. Please contact administrator."}
        )
    except AccountLockedError:
        raise HTTPException(
            status_code=423, detail={"error": "Account locked. Please contact Super Admin."}
        )
    return Token(access_token=access_token, refresh_token=payload.refresh_token)


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    current_token: str = Depends(oauth2_scheme),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LogoutResponse:
    service = AuthService(db)
    await service.logout(current_token)
    return LogoutResponse()


@router.get("/me", response_model=UserMe)
async def get_me(current_user=Depends(get_current_user)) -> UserMe:
    return UserMe.model_validate(current_user)


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    service = AuthService(db)
    try:
        await service.forgot_password(payload.email)
    except UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Email not found. Please check your email address.",
                "error_code": "EMAIL_NOT_FOUND",
            },
        )

    return {
        "message": "A password reset link has been sent to your registered email.",
        "success": True,
    }


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    service = AuthService(db)
    try:
        await service.reset_password(payload.token, payload.new_password)
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail={"error": "Invalid or expired reset token."})
    except WeakPasswordError:
        raise HTTPException(
            status_code=400, detail={"error": "Password does not meet security requirements."}
        )
    except SamePasswordError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "New password must be different from your current password.",
                "error_code": "SAME_PASSWORD",
            },
        )
    return {"message": "Password reset successful."}


@router.post("/verify-reset-token")
async def verify_reset_token_endpoint(payload: dict, db: AsyncSession = Depends(get_db)) -> dict:
    """Verify reset token without resetting password."""
    service = AuthService(db)
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail={"error": "Token is required."})

    try:
        token_payload = await service.verify_reset_token(token)
        if not token_payload:
            raise InvalidTokenError

        # Get user info
        result = await db.execute(select(User).filter(User.id == token_payload["user_id"]))
        user = result.scalar_one_or_none()
        if not user:
            raise InvalidTokenError

        return {
            "valid": True,
            "email": user.email,
            "message": "Token is valid.",
        }
    except InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Invalid or expired reset token. Please request a new password reset.",
                "error_code": "INVALID_TOKEN",
            },
        )
