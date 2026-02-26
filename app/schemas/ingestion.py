from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IngestionRead(BaseModel):
    id: UUID
    knowledge_base_id: UUID
    user_id: UUID | None = None
    status: str
    error_message: str | None = None
    documents_processed: int
    chunks_created: int
    duration_ms: int | None = None
    created_at: datetime
    finished_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
