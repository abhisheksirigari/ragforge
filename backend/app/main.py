"""
RAGForge API — Agentic Document Intelligence Platform.
Run: uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.db import init_db
from app.api import routes_auth, routes_documents, routes_chat, routes_eval, routes_analytics

app = FastAPI(
    title="RAGForge API",
    description="Agentic RAG platform: document ingestion, grounded retrieval, tool-calling agent, and retrieval evaluation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(routes_auth.router)
app.include_router(routes_documents.router)
app.include_router(routes_chat.router)
app.include_router(routes_eval.router)
app.include_router(routes_analytics.router)


@app.get("/")
def root():
    return {"service": "RAGForge API", "status": "operational", "docs": "/docs"}
