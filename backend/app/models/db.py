"""
SQLAlchemy models + engine/session setup.
Uses SQLite for zero-config local/dev use; swapping to Postgres only
requires changing SQLITE_PATH -> a DATABASE_URL in production.
"""
import datetime as dt

from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    f"sqlite:///{settings.sqlite_path}",
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, default="")
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="owner", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    status = Column(String, default="processing")  # processing | ready | failed
    chunk_count = Column(Integer, default=0)
    char_count = Column(Integer, default=0)
    error_message = Column(String, default="")
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    owner = relationship("User", back_populates="documents")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="New conversation")
    mode = Column(String, default="rag")  # rag | agent
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    owner = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    citations_json = Column(Text, default="[]")
    trace_json = Column(Text, default="[]")  # tool-call / retrieval trace for agent mode
    latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class EvalRun(Base):
    __tablename__ = "eval_runs"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(String, nullable=False)
    expected_keywords = Column(String, default="")
    retrieved_count = Column(Integer, default=0)
    hit = Column(Boolean, default=False)
    precision_at_k = Column(Float, default=0.0)
    latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=dt.datetime.utcnow)


def init_db():
    import os
    os.makedirs(os.path.dirname(settings.sqlite_path) or ".", exist_ok=True)
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
