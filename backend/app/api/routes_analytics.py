from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.models.db import get_db, User, Document, ChatSession, ChatMessage

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
def overview(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    documents = db.query(Document).filter(Document.owner_id == user.id).all()
    sessions = db.query(ChatSession).filter(ChatSession.owner_id == user.id).all()
    session_ids = [s.id for s in sessions]
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id.in_(session_ids), ChatMessage.role == "assistant")
        .all()
        if session_ids else []
    )

    total_chunks = sum(d.chunk_count for d in documents)
    ready_docs = sum(1 for d in documents if d.status == "ready")
    failed_docs = sum(1 for d in documents if d.status == "failed")
    avg_latency = round(sum(m.latency_ms for m in messages) / len(messages), 1) if messages else 0.0

    latency_trend = [
        {"turn": i + 1, "latencyMs": round(m.latency_ms, 1)}
        for i, m in enumerate(sorted(messages, key=lambda m: m.created_at)[-20:])
    ]

    return {
        "documentsUploaded": len(documents),
        "documentsReady": ready_docs,
        "documentsFailed": failed_docs,
        "totalChunksIndexed": total_chunks,
        "chatSessions": len(sessions),
        "assistantMessages": len(messages),
        "avgResponseLatencyMs": avg_latency,
        "latencyTrend": latency_trend,
    }
