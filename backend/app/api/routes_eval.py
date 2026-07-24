from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core import vectorstore
from app.core.evaluation import score_retrieval
from app.models.db import get_db, User, EvalRun
from app.models.schemas import EvalRequest, EvalResult, EvalSummary

router = APIRouter(prefix="/api/eval", tags=["evaluation"])


@router.post("/run", response_model=EvalResult)
def run_eval(payload: EvalRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    import time
    t0 = time.time()
    hits = vectorstore.search(user.id, payload.question)
    latency_ms = (time.time() - t0) * 1000

    snippets = [h["snippet"] for h in hits]
    scored = score_retrieval(snippets, payload.expected_keywords)

    run = EvalRun(
        owner_id=user.id,
        question=payload.question,
        expected_keywords=", ".join(payload.expected_keywords),
        retrieved_count=len(hits),
        hit=bool(scored["hit"]) if scored["hit"] is not None else False,
        precision_at_k=scored["precision_at_k"] or 0.0,
        latency_ms=latency_ms,
    )
    db.add(run)
    db.commit()

    return EvalResult(
        question=payload.question,
        retrieved_count=len(hits),
        hit=bool(scored["hit"]) if scored["hit"] is not None else False,
        precision_at_k=scored["precision_at_k"] or 0.0,
        latency_ms=round(latency_ms, 1),
        retrieved_snippets=snippets,
    )


@router.get("/summary", response_model=EvalSummary)
def eval_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    runs: List[EvalRun] = (
        db.query(EvalRun)
        .filter(EvalRun.owner_id == user.id)
        .order_by(EvalRun.created_at.desc())
        .all()
    )
    if not runs:
        return EvalSummary(total_runs=0, hit_rate=0.0, avg_precision_at_k=0.0, avg_latency_ms=0.0, recent=[])

    hit_rate = sum(1 for r in runs if r.hit) / len(runs)
    avg_precision = sum(r.precision_at_k for r in runs) / len(runs)
    avg_latency = sum(r.latency_ms for r in runs) / len(runs)

    recent = [
        EvalResult(
            question=r.question,
            retrieved_count=r.retrieved_count,
            hit=r.hit,
            precision_at_k=r.precision_at_k,
            latency_ms=round(r.latency_ms, 1),
            retrieved_snippets=[],
        )
        for r in runs[:10]
    ]

    return EvalSummary(
        total_runs=len(runs),
        hit_rate=round(hit_rate, 3),
        avg_precision_at_k=round(avg_precision, 3),
        avg_latency_ms=round(avg_latency, 1),
        recent=recent,
    )
