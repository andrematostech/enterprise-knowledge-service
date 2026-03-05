from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DocumentRead(BaseModel):
    id: UUID
    knowledge_base_id: UUID
    filename: str
    content_type: str
    size_bytes: int
    source: str | None = None
    status: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentRegisterRequest(BaseModel):
    knowledge_base_id: UUID
    relative_path: str
    content_type: str | None = None
    filename: str | None = None
