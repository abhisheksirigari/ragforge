"""Orchestrates turning an uploaded file into searchable vector chunks."""
import os

from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.chunking import extract_text, chunk_text
from app.core import vectorstore
from app.models.db import Document

settings = get_settings()


def ingest_document(db: Session, owner_id: int, filename: str, raw_bytes: bytes) -> Document:
    os.makedirs(settings.upload_dir, exist_ok=True)

    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "txt"
    doc = Document(owner_id=owner_id, filename=filename, file_type=ext, status="processing")
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        # Persist the raw file for traceability / re-processing.
        stored_path = os.path.join(settings.upload_dir, f"{owner_id}_{doc.id}_{filename}")
        with open(stored_path, "wb") as f:
            f.write(raw_bytes)

        text = extract_text(filename, raw_bytes)
        chunks = chunk_text(text)

        if not chunks:
            doc.status = "failed"
            doc.error_message = "No extractable text found in this file."
            db.commit()
            return doc

        vectorstore.add_chunks(owner_id, doc.id, filename, chunks)

        doc.status = "ready"
        doc.chunk_count = len(chunks)
        doc.char_count = len(text)
        db.commit()
        db.refresh(doc)
        return doc

    except Exception as e:
        doc.status = "failed"
        doc.error_message = str(e)
        db.commit()
        db.refresh(doc)
        return doc


def delete_document(db: Session, document_id: int) -> None:
    vectorstore.delete_document(document_id)
    db.query(Document).filter(Document.id == document_id).delete()
    db.commit()
