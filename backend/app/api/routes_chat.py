import json
import time
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.agent import run_agent
from app.models.db import get_db, User, ChatSession, ChatMessage
from app.models.schemas import ChatRequest, ChatResponse, Citation, TraceStep, ChatSessionOut, ChatMessageOut
from app.services import rag_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/sessions", response_model=List[ChatSessionOut])
def list_sessions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(ChatSession)
        .filter(ChatSession.owner_id == user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageOut])
def get_session_messages(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.owner_id == user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    out = []
    for m in session.messages:
        out.append(ChatMessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            citations=[Citation(**c) for c in json.loads(m.citations_json)],
            trace=[TraceStep(**t) for t in json.loads(m.trace_json)],
            latency_ms=m.latency_ms,
            created_at=m.created_at,
        ))
    return out


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.mode not in ("rag", "agent"):
        raise HTTPException(status_code=400, detail="mode must be 'rag' or 'agent'")

    session = None
    if payload.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == payload.session_id, ChatSession.owner_id == user.id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    if not session:
        title = payload.message[:60] + ("..." if len(payload.message) > 60 else "")
        session = ChatSession(owner_id=user.id, title=title, mode=payload.mode)
        db.add(session)
        db.commit()
        db.refresh(session)

    db.add(ChatMessage(session_id=session.id, role="user", content=payload.message))
    db.commit()

    t0 = time.time()
    try:
        if payload.mode == "agent":
            result = run_agent(user.id, payload.message)
        else:
            result = rag_service.answer_question(user.id, payload.message)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM call failed: {e}. Check your API key in backend/.env.")
    total_ms = (time.time() - t0) * 1000

    citations = [Citation(**c) for c in result["citations"]]
    trace = [TraceStep(**t) for t in result["trace"]]

    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=result["answer"],
        citations_json=json.dumps(result["citations"]),
        trace_json=json.dumps(result["trace"]),
        latency_ms=total_ms,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return ChatResponse(
        session_id=session.id,
        message_id=assistant_msg.id,
        answer=result["answer"],
        citations=citations,
        trace=trace,
        latency_ms=round(total_ms, 1),
    )
