from fastapi import APIRouter, Depends, status

from app.api.deps import require_api_key


router = APIRouter(
    prefix="/knowledge-bases/{knowledge_base_id}",
    tags=["query"],
    dependencies=[Depends(require_api_key)],
)


@router.post("/query", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def query_knowledge_base(knowledge_base_id: str) -> dict[str, str]:
    return {"detail": "Not implemented"}
