from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..core.database import get_db
from ..core.users import get_current_user
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
    InvalidCredentialsError,
    InvalidTokenError,
    InactiveAccountError,  
    UserNotFoundError,
    WeakPasswordError,
    InvalidCampusError,
    InvalidPasswordError,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)) -> Token:
    service = AuthService(db)
    try:
        access_token, refresh_token = await service.login(payload.email, payload.password, payload.campus_id)
    except AccountLockedError:
        raise HTTPException(
            status_code=423,
            detail={"error": "Account locked due to multiple failed login attempts. Please contact Super Admin."}
        )
    except InactiveAccountError:  
        raise HTTPException(
            status_code=403,
            detail={"error": "Account is inactive. Please contact administrator."}
        )
    except UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"error": "Email not found. Please check your email address."}
        )
    except InvalidCampusError:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid campus. Please select the correct campus for your account."}
        )
    except InvalidPasswordError:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid password. Please check your password and try again."}
        )
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid email or password."}
        )
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh_token(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)) -> Token:
    """Refresh access token using refresh token."""
    service = AuthService(db)
    try:
        access_token = await service.refresh_access_token(payload.refresh_token)
    except InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid or expired refresh token. Please login again."}
        )
    except InactiveAccountError:
        raise HTTPException(
            status_code=403,
            detail={"error": "Account is inactive. Please contact administrator."}
        )
    except AccountLockedError:
        raise HTTPException(
            status_code=423,
            detail={"error": "Account locked. Please contact Super Admin."}
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
    """Get current user information."""
    return UserMe.model_validate(current_user)

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    service = AuthService(db)
    try:
        reset_token = await service.forgot_password(payload.email)
    except UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"error": "Email not found. Please contact the Super Admin."}
        )
    return {
        "message": "A password reset link has been sent to your registered email.",
        "reset_token": reset_token,
    }

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    service = AuthService(db)
    try:
        await service.reset_password(payload.token, payload.new_password)
    except InvalidTokenError:
        raise HTTPException(
            status_code=401,  
            detail={"error": "Invalid or expired reset token."}
        )
    except WeakPasswordError:
        raise HTTPException(
            status_code=400, 
            detail={"error": "Password does not meet security requirements."}
        )
    return {"message": "Password reset successful."}