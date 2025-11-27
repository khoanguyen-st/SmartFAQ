"""User-related Pydantic schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UserLogin(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "campus_id": "DN",
                "email": "admin@example.com",
                "password": "secure_password",
            }
        }
    )

    campus_id: Literal["DN", "HCM", "HN", "CT"] = Field(..., description="Campus identifier")
    email: str = Field(..., description="Email for authentication")
    password: str = Field(..., description="Password for authentication")


class Token(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
            }
        }
    )

    access_token: str = Field(..., description="JWT access token (5 minutes)")
    refresh_token: str = Field(..., description="JWT refresh token (24 hours)")
    token_type: str = Field(default="bearer", description="Token type")


class RefreshTokenRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}}
    )

    refresh_token: str = Field(..., description="JWT refresh token")


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={"example": {"email": "user@example.com"}})

    email: str = Field(..., description="Registered email address")


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "new_password": "NewSecurePassword123!",
            }
        }
    )

    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")


class LogoutResponse(BaseModel):
    model_config = ConfigDict(json_schema_extra={"example": {"message": "Successfully logged out"}})

    message: str = Field(default="Successfully logged out", description="Success message")


class UserMe(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "admin",
                "email": "admin@example.com",
                "campus_id": "HCM",
                "role": "ADMIN",
                "is_active": True,
                "notification_email": "admin@example.com",
                "created_at": "2025-01-01T00:00:00Z",
            }
        },
    )

    id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email address")
    campus_id: str = Field(..., description="Campus identifier")
    role: str = Field(..., description="User role")
    is_active: bool = Field(..., description="Account active status")
    notification_email: str | None = Field(None, description="Notification email")
    created_at: datetime = Field(..., description="Account creation date")


class UnlockAccountResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"message": "Account unlocked successfully"}}
    )

    message: str = Field(default="Account unlocked successfully", description="Success message")
