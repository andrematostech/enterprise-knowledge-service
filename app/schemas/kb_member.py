from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class KnowledgeBaseMemberCreate(BaseModel):
    user_id: UUID | None = None
    email: EmailStr | None = None
    role: Literal["owner", "admin", "member", "viewer"] = Field(default="member")


class KnowledgeBaseMemberUpdate(BaseModel):
    role: Literal["owner", "admin", "member", "viewer"]


class KnowledgeBaseMemberRead(BaseModel):
    id: UUID
    user_id: UUID
    email: EmailStr | None
    full_name: str | None
    position: str | None
    role: str
    created_at: datetime
