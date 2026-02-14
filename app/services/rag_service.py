from app.core.config import Settings
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.schemas.query import QueryRequest, QueryResponse, QuerySource
from app.services.openai_service import OpenAIService
from app.services.vector_store_service import VectorStoreService


class RagService:
    def __init__(
        self,
        settings: Settings,
        knowledge_base_repo: KnowledgeBaseRepository,
        openai_service: OpenAIService,
        vector_store: VectorStoreService,
    ) -> None:
        self._settings = settings
        self._knowledge_base_repo = knowledge_base_repo
        self._openai = openai_service
        self._vector_store = vector_store

    def query(self, knowledge_base_id: str, payload: QueryRequest) -> QueryResponse:
        knowledge_base = self._knowledge_base_repo.get(knowledge_base_id)
        if not knowledge_base:
            raise ValueError("Knowledge base not found")

        embedding = self._openai.embed_texts([payload.question])[0]
        results = self._vector_store.query(str(knowledge_base_id), embedding, payload.top_k)

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        sources: list[QuerySource] = []
        context_blocks: list[str] = []

        for idx, text in enumerate(documents):
            metadata = metadatas[idx] if idx < len(metadatas) else {}
            distance = distances[idx] if idx < len(distances) else None
            score = 0.0
            if isinstance(distance, (int, float)):
                score = max(0.0, 1.0 - float(distance))

            chunk_id = metadata.get("chunk_id", "")
            document_id = metadata.get("document_id", "")
            filename = metadata.get("filename", "")
            excerpt = (text or "")[:240]

            sources.append(
                QuerySource(
                    chunk_id=chunk_id,
                    document_id=document_id,
                    filename=filename,
                    score=score,
                    excerpt=excerpt,
                )
            )
            context_blocks.append(f"[{idx + 1}] {text}")

        if not context_blocks:
            return QueryResponse(
                answer="I don't have enough information in the provided documents.",
                sources=[],
            )

        system_prompt = (
            "You are a precise assistant answering questions using only the provided context. "
            "If the context is insufficient, say: 'I don't have enough information in the provided documents.'"
        )
        user_prompt = (
            "Answer the question using only the context below. "
            "Cite sources inline using [1], [2], etc.\n\n"
            f"Context:\n{chr(10).join(context_blocks)}\n\n"
            f"Question: {payload.question}"
        )

        answer = self._openai.generate_answer(system_prompt, user_prompt)
        if not answer:
            answer = "I don't have enough information in the provided documents."

        return QueryResponse(answer=answer, sources=sources)
