"""User-related Pydantic schemas."""

from pydantic import BaseModel, Field


class UserLogin(BaseModel):
    """
    Schema for login request body (AC 1).
    
    Fields:
        username: Username for authentication (required)
        password: Password for authentication (required)
    """
    username: str = Field(..., description="Username for authentication")
    password: str = Field(..., description="Password for authentication")
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
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


