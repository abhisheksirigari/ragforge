"""Pydantic request/response schemas — the API's public contract."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str

    class Config:
        from_attributes = True


# --- Documents ---

class DocumentOut(BaseModel):
    id: int
    filename: str
    file_type: str
    status: str
    chunk_count: int
    char_count: int
    error_message: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Chat / RAG ---

class ChatRequest(BaseModel):
    session_id: Optional[int] = None
    message: str
    mode: str = "rag"  # "rag" or "agent"


class Citation(BaseModel):
    document_id: int
    filename: str
    chunk_index: int
    snippet: str
    score: float


class TraceStep(BaseModel):
    step: str          # e.g. "retrieve_documents", "calculator", "final_answer"
    detail: str
    duration_ms: float


class ChatResponse(BaseModel):
    session_id: int
    message_id: int
    answer: str
    citations: List[Citation]
    trace: List[TraceStep]
    latency_ms: float


class ChatSessionOut(BaseModel):
    id: int
    title: str
    mode: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    citations: List[Citation]
    trace: List[TraceStep]
    latency_ms: float
    created_at: datetime


# --- Evaluation ---

class EvalRequest(BaseModel):
    question: str
    expected_keywords: List[str] = []


class EvalResult(BaseModel):
    question: str
    retrieved_count: int
    hit: bool
    precision_at_k: float
    latency_ms: float
    retrieved_snippets: List[str]


class EvalSummary(BaseModel):
    total_runs: int
    hit_rate: float
    avg_precision_at_k: float
    avg_latency_ms: float
    recent: List[EvalResult]
