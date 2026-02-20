from datetime import datetime
import uuid

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = None
    position: str | None = None
    avatar_url: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None = None
    position: str | None = None
    avatar_url: str | None = None
    is_active: bool
    created_at: datetime
    is_admin: bool = False

    model_config = {"from_attributes": True}
