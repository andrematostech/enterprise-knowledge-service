import os
from pathlib import Path

from fastapi import UploadFile


def ensure_directory(path: str) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)


def sanitize_filename(filename: str) -> str:
    name = Path(filename).name
    return name.replace("\\", "_").replace("/", "_")


def save_upload_file(upload: UploadFile, destination: str, max_bytes: int) -> int:
    ensure_directory(os.path.dirname(destination))
    size = 0
    with open(destination, "wb") as target:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > max_bytes:
                target.close()
                try:
                    os.remove(destination)
                except OSError:
                    pass
                raise ValueError("File too large")
            target.write(chunk)
    return size
