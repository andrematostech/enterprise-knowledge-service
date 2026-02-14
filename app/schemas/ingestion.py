from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IngestionRead(BaseModel):
    id: UUID
    knowledge_base_id: UUID
    status: str
    message: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
