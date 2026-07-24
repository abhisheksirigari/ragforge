"""
Turns raw uploaded files into clean text, then into overlapping chunks
suitable for embedding. Chunking uses a sliding window measured in
characters (simple, deterministic, no tokenizer dependency at ingest time).
"""
import io
from typing import List

from pypdf import PdfReader
from docx import Document as DocxDocument

from app.config import get_settings

settings = get_settings()


def extract_text(filename: str, raw_bytes: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1]

    if ext == "pdf":
        reader = PdfReader(io.BytesIO(raw_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if ext == "docx":
        doc = DocxDocument(io.BytesIO(raw_bytes))
        return "\n".join(p.text for p in doc.paragraphs)

    # txt / md / anything else: assume utf-8 text
    return raw_bytes.decode("utf-8", errors="ignore")


def chunk_text(
    text: str,
    chunk_size: int = None,
    overlap: int = None,
) -> List[str]:
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap

    # Normalize whitespace so chunk boundaries land on real content.
    text = " ".join(text.split())
    if not text:
        return []

    chunks = []
    start = 0
    length = len(text)
    step = max(1, chunk_size - overlap)

    while start < length:
        end = min(start + chunk_size, length)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == length:
            break
        start += step

    return chunks
