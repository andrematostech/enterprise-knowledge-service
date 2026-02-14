from datetime import datetime

from pydantic import BaseModel


class KnowledgeBaseCreate(BaseModel):
    name: str
    description: str | None = None


class KnowledgeBaseRead(BaseModel):
    id: str
    name: str
    description: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
