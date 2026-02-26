from uuid import uuid4

from app.core.config import Settings
from app.schemas.query import QueryRequest
from app.services.rag_service import RagService


class FakeKnowledgeBaseRepo:
    def get(self, knowledge_base_id):
        return {"id": knowledge_base_id, "name": "KB"}


class FakeOpenAIService:
    def embed_texts(self, texts):
        return [[0.1, 0.2, 0.3] for _ in texts]

    def generate_answer(self, system_prompt, user_prompt):
        return "Answer"


class FakeVectorStore:
    def query(self, knowledge_base_id, embedding, top_k):
        return {"documents": [[]], "metadatas": [[]], "distances": [[]]}


class FakeQueryLogRepo:
    def __init__(self):
        self.logged = []

    def create(self, log):
        self.logged.append(log)
        return log


def test_rag_service_logs_query():
    settings = Settings()
    log_repo = FakeQueryLogRepo()
    service = RagService(
        settings=settings,
        knowledge_base_repo=FakeKnowledgeBaseRepo(),
        openai_service=FakeOpenAIService(),
        vector_store=FakeVectorStore(),
        query_log_repo=log_repo,
    )

    kb_id = uuid4()
    payload = QueryRequest(question="What is EKS?", top_k=3)
    response = service.query(str(kb_id), payload, user_id=None)

    assert response.answer
    assert len(log_repo.logged) == 1
