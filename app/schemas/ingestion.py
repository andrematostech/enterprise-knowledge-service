from datetime import datetime

from pydantic import BaseModel


class IngestionRead(BaseModel):
    id: str
    knowledge_base_id: str
    status: str
    message: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
