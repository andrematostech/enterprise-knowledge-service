from datetime import datetime
import uuid
from typing import Literal

from pydantic import BaseModel, EmailStr


class MessageCreate(BaseModel):
    scope: Literal["direct", "broadcast"]
    recipient_email: EmailStr | None = None
    subject: str | None = None
    body: str


class MessageRead(BaseModel):
    id: uuid.UUID
    scope: str
    subject: str | None = None
    body: str
    created_at: datetime
    read_at: datetime | None = None
    sender_email: EmailStr | None = None
    sender_name: str | None = None
    recipient_email: EmailStr | None = None

    model_config = {"from_attributes": True}
