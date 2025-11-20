"""User-related Pydantic schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class UserLogin(BaseModel):
    """
    Schema for login request body (AC 1, AC 2.2).
    
    Fields:
        campus_id: Campus identifier (required, enum: DN, HCM, HN, CT)
        email: Email for authentication (required)
        password: Password for authentication (required)
    """
    campus_id: Literal["DN", "HCM", "HN", "CT"] = Field(..., description="Campus identifier")
    email: str = Field(..., description="Email for authentication")
    password: str = Field(..., description="Password for authentication")
    
    class Config:
        json_schema_extra = {
            "example": {
                "campus_id": "DN",
                "email": "admin@example.com",
                "password": "secure_password"
            }
        }

class Token(BaseModel):
    """
    Schema for login response body (AC 2.1).
    
    Fields:
        access_token: JWT access token (valid for 8 hours)
        token_type: Token type (default: "bearer")
    """
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }

class ForgotPasswordRequest(BaseModel):
    """
    Schema for forgot password request (AC 7.1).
    
    Fields:
        email: Registered email address (required)
    """
    email: str = Field(..., description="Registered email address")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }

class ResetPasswordRequest(BaseModel):
    """
    Schema for reset password request (AC 7.4).
    
    Fields:
        token: Password reset token (required)
        new_password: New password (required, min 8 characters)
    """
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "new_password": "NewSecurePassword123!"
            }
        }

class LogoutResponse(BaseModel):
    """
    Schema for logout response (AC 6).
    
    Fields:
        message: Success message
    """
    message: str = Field(default="Successfully logged out", description="Success message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Successfully logged out"
            }
        }

class UserMe(BaseModel):
    """
    Schema for /auth/me response.
    
    Returns current user information (without sensitive data).
    """
    id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email address")
    campus_id: str = Field(..., description="Campus identifier")
    role: str = Field(..., description="User role")
    is_active: bool = Field(..., description="Account active status")
    notification_email: str | None = Field(None, description="Notification email")
    created_at: datetime = Field(..., description="Account creation date")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "username": "admin",
                "email": "admin@example.com",
                "campus_id": "HCM",
                "role": "ADMIN",
                "is_active": True,
                "notification_email": "admin@example.com",
                "created_at": "2025-01-01T00:00:00Z"
            }
        }

class UnlockAccountResponse(BaseModel):
    """Schema for unlock account response."""
    message: str = Field(default="Account unlocked successfully", description="Success message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Account unlocked successfully"
            }
        }


