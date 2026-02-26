import hashlib
from pathlib import Path


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def sha256_file(path: str) -> str:
    file_path = Path(path)
    if not file_path.exists():
        raise ValueError("File not found")
    return sha256_bytes(file_path.read_bytes())
