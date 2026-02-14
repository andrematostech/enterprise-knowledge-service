from pathlib import Path

from pypdf import PdfReader


SUPPORTED_TEXT_TYPES = {"text/plain", "text/markdown"}


def extract_text_from_file(path: str, content_type: str) -> str:
    file_path = Path(path)
    if not file_path.exists():
        raise ValueError("File not found")

    if content_type == "application/pdf" or file_path.suffix.lower() == ".pdf":
        reader = PdfReader(str(file_path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if content_type in SUPPORTED_TEXT_TYPES or file_path.suffix.lower() in {".txt", ".md", ".markdown"}:
        return file_path.read_text(encoding="utf-8", errors="ignore")

    raise ValueError("Unsupported document type")
