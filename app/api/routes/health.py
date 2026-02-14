from fastapi import APIRouter


router = APIRouter()


@router.get("/")
def root() -> dict[str, str]:
    return {"service": "Enterprise Knowledge Service", "status": "ok"}


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
