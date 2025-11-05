
"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..core.security import authenticate_user, create_access_token
from ..core.users import get_current_user

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(payload: LoginRequest) -> dict[str, str]:
    user = await authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=user.username)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
async def read_current_user(current_user=Depends(get_current_user)) -> dict[str, str]:
    return {"username": current_user.username, "role": current_user.role}
