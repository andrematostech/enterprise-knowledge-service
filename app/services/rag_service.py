from app.core.config import Settings
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
import time

from app.models.query_log import QueryLog
from app.repositories.query_log_repository import QueryLogRepository
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
        query_log_repo: QueryLogRepository,
    ) -> None:
        self._settings = settings
        self._knowledge_base_repo = knowledge_base_repo
        self._openai = openai_service
        self._vector_store = vector_store
        self._query_log_repo = query_log_repo

    def query(self, knowledge_base_id: str, payload: QueryRequest, user_id) -> QueryResponse:
        knowledge_base = self._knowledge_base_repo.get(knowledge_base_id)
        if not knowledge_base:
            raise ValueError("Knowledge base not found")

        started = time.perf_counter()
        embed_ms = retrieve_ms = generate_ms = None
        retrieved_count = 0
        error_message = None

        try:
            embed_start = time.perf_counter()
            embedding = self._openai.embed_texts([payload.question])[0]
            embed_ms = int((time.perf_counter() - embed_start) * 1000)

            retrieve_start = time.perf_counter()
            results = self._vector_store.query(str(knowledge_base_id), embedding, payload.top_k)
            retrieve_ms = int((time.perf_counter() - retrieve_start) * 1000)

            documents = results.get("documents", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0]
            retrieved_count = len(documents)

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
                response = QueryResponse(
                    answer="I don't have enough information in the provided documents.",
                    sources=[],
                )
                total_ms = int((time.perf_counter() - started) * 1000)
                self._query_log_repo.create(
                    QueryLog(
                        knowledge_base_id=knowledge_base_id,
                        user_id=user_id,
                        query_text=payload.question,
                        latency_ms=total_ms,
                        embed_ms=embed_ms,
                        retrieve_ms=retrieve_ms,
                        generate_ms=generate_ms,
                        retrieved_k=payload.top_k,
                        retrieved_count=retrieved_count,
                        model=self._settings.openai_gen_model or None,
                        embedding_model=self._settings.openai_embed_model,
                        vector_db="chroma",
                        error=None,
                    )
                )
                return response

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

            generate_start = time.perf_counter()
            answer = self._openai.generate_answer(system_prompt, user_prompt)
            generate_ms = int((time.perf_counter() - generate_start) * 1000)
            if not answer:
                answer = "I don't have enough information in the provided documents."

            response = QueryResponse(answer=answer, sources=sources)
            total_ms = int((time.perf_counter() - started) * 1000)
            self._query_log_repo.create(
                QueryLog(
                    knowledge_base_id=knowledge_base_id,
                    user_id=user_id,
                    query_text=payload.question,
                    latency_ms=total_ms,
                    embed_ms=embed_ms,
                    retrieve_ms=retrieve_ms,
                    generate_ms=generate_ms,
                    retrieved_k=payload.top_k,
                    retrieved_count=retrieved_count,
                    model=self._settings.openai_gen_model or None,
                    embedding_model=self._settings.openai_embed_model,
                    vector_db="chroma",
                    error=None,
                )
            )
            return response
        except Exception as exc:  # noqa: BLE001
            total_ms = int((time.perf_counter() - started) * 1000)
            error_message = str(exc)
            self._query_log_repo.create(
                QueryLog(
                    knowledge_base_id=knowledge_base_id,
                    user_id=user_id,
                    query_text=payload.question,
                    latency_ms=total_ms,
                    embed_ms=embed_ms,
                    retrieve_ms=retrieve_ms,
                    generate_ms=generate_ms,
                    retrieved_k=payload.top_k,
                    retrieved_count=retrieved_count,
                    model=self._settings.openai_gen_model or None,
                    embedding_model=self._settings.openai_embed_model,
                    vector_db="chroma",
                    error=error_message,
                )
            )
            raise
