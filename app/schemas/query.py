from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str
    top_k: int = Field(default=5, ge=1, le=20)


class QuerySource(BaseModel):
    chunk_id: str
    document_id: str
    filename: str
    score: float
    excerpt: str


class QueryResponse(BaseModel):
    answer: str
    sources: list[QuerySource]
