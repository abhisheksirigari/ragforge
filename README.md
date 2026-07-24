# RAGForge — Agentic Document Intelligence Platform

[![Live Demo](https://shields.io)](https://ragforge.onrender.com)

A full-stack Retrieval-Augmented Generation platform: upload documents, ask questions grounded in them with inline citations, or hand the question to a tool-calling agent that decides for itself whether to search your documents, run a calculation, or answer directly — with every step traced in the UI.

Built to demonstrate real AI engineering, not a chatbot wrapper:
*   **Real Local Embeddings** (`sentence-transformers`) — retrieval works offline, no API cost per search.
*   **Real LLM Integration** (Anthropic Claude, OpenAI, or Gemini) — swappable via one env var.
*   **Real Tool-Calling Agent Loop** — autonomous execution, not a scripted demo.
*   **Retrieval Evaluation Harness** — hit rate, precision@k, and latency tracked over time.
*   **Layered Backend Architecture** — strict separation from API → services → core, with a typed React frontend.

---

## 🛠️ Features

*   ✅ **RAG Chat** — Grounded responses with precise source tracking
*   ✅ **Agent Mode** — Autonomous tool execution & multi-turn loop
*   ✅ **Document Upload** — Support for PDF, DOCX, TXT, and MD files
*   ✅ **JWT Authentication** — User-scoped isolated workspaces
*   ✅ **ChromaDB** — Persistent embedded local vector storage
*   ✅ **Evaluation Harness** — Keyword-based retrieval accuracy scoring
*   ✅ **Docker Integration** — Ready-to-go multi-container deployment
*   ✅ **FastAPI & React** — High-performance backend paired with a typed frontend
*   ✅ **Inline Citations** — Visual validation directly tied to matching chunks

---

## 📂 Architecture

```text
ragforge/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app, router wiring
│   │   ├── config.py              # Environment-driven settings
│   │   ├── core/
│   │   │   ├── security.py        # JWT + password hashing
│   │   │   ├── chunking.py        # PDF/DOCX/TXT parsing + chunking
│   │   │   ├── embeddings.py      # Local sentence-transformers wrapper
│   │   │   ├── vectorstore.py     # ChromaDB persistent collection
│   │   │   ├── llm_client.py      # Provider-agnostic LLM client (Anthropic/OpenAI)
│   │   │   ├── agent.py           # Tool-calling agent loop
│   │   │   └── evaluation.py      # Keyword-based retrieval scoring
│   │   ├── services/
│   │   │   ├── ingestion_service.py  # Upload → parse → chunk → embed → store
│   │   │   └── rag_service.py        # Retrieve → synthesize grounded answer
│   │   ├── api/                   # Route handlers (auth, documents, chat, eval, analytics)
│   │   └── models/                # SQLAlchemy models + Pydantic schemas
│   ├── seed_data/                 # Two sample docs for a quick demo
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/                 # Dashboard, Documents, Chat, Evaluation, Login
        ├── components/            # TraceView, CitationBadge, UploadDropzone, Sidebar
        └── api/client.js          # Fetch wrapper + JWT handling
```

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
```
Open `.env` and set your `LLM_PROVIDER` and corresponding API key. 

> [!TIP]
> **Free Tier Option:** Gemini has a permanent, no-credit-card free tier.
> Set `LLM_PROVIDER=gemini` and get a key from [Google AI Studio](https://aistudio.google.com/apikey).

Start the server:
```bash
uvicorn app.main:app --reload --port 8000
```
*Note: The first request that triggers an embedding will download the `all-MiniLM-L6-v2` model (~90MB) from Hugging Face automatically.*

### 2. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173`, register an account, and upload the files inside `backend/seed_data/` to test immediately.

### 🐳 Run with Docker Compose
```bash
cp backend/.env.example backend/.env   # Add your API keys inside backend/.env
docker compose up --build
```

---

## 💡 Using the Platform

1.  **Sign Up:** Creates an isolated workspace scoped to your User ID. Vector chunks are namespaced by user, allowing multi-tenant isolation.
2.  **Documents:** Drag and drop files. They are text-extracted, chunked (800 characters, 120 overlap default), embedded, and stored in Chroma.
3.  **Chat (RAG Mode):** Fetches the top-5 matching document chunks and requires the LLM to write a response strictly utilizing them, injecting numeric citations.
4.  **Chat (Agent Mode):** The LLM dynamically decides whether to invoke `retrieve_documents`, `calculator`, both, or neither. The **Execution Trace** panel breaks down runtimes and decisions step-by-step.
5.  **Evaluation:** Provide a test query and expected keywords. RAGForge tracks whether the retrieval system succeeded (`hit/miss` + `precision@k`) to help you gauge performance changes.

---

## 🧠 Design Notes & Interview Talking Points

*   **Decoupled Architecture:** Embeddings run completely independent of the text-generation engine. Your data retrieval workflow remains uncompromised regardless of which LLM API choice is live.
*   **Unified Interface Pattern:** `llm_client.py` wraps Anthropic, OpenAI, and Gemini beneath one contract. It handles schema translation dynamically, unlocking provider hot-swapping with zero service-layer refactoring.
*   **True Agentic Control Loop:** The agent framework does not execute single scripted tool invocations. It operates a deterministic evaluation loop, allowing it to daisy-chain execution results over multi-turn interactions.
*   **Lean Evaluation Engine:** The scoring framework uses keyword-matching by design to remain lightweight and dependency-free. This contract makes it simple to extend into LLM-assisted or semantic evaluations down the road.

---

## ⚙️ Environment Variables (`backend/.env`)

| Variable | Purpose | Supported Values |
| :--- | :--- | :--- |
| `LLM_PROVIDER` | Sets active orchestration model engine | `anthropic`, `openai`, `gemini` |
| `ANTHROPIC_API_KEY` | Authentication credential token | `sk-ant-...` |
| `OPENAI_API_KEY` | Authentication credential token | `sk-...` |
| `GEMINI_API_KEY` | Authentication credential token | *Your Google AI Studio Key* |
| `ANTHROPIC_MODEL` | Specific generation model identifier | e.g., `claude-3-5-sonnet` |
| `OPENAI_MODEL` | Specific generation model identifier | e.g., `gpt-4o` |
| `GEMINI_MODEL` | Specific generation model identifier | e.g., `gemini-1.5-pro` |
| `EMBEDDING_PROVIDER` | Pick cloud API optimization or local power | `gemini` (Default), `local` |
| `EMBEDDING_MODEL` | Local vectorizer framework model choice | Any valid `sentence-transformers` name |
| `GEMINI_EMBEDDING_MODEL`| Gemini engine vectorizer selection name | Model identifier |
| `JWT_SECRET` | Cryptographic signing key passphrase | Long randomized string |
| `CHUNK_SIZE` | Parsing token chunk boundary constraints | Default: `800` |
| `CHUNK_OVERLAP` | Parsing token window overlap boundary | Default: `120` |
| `TOP_K` | Count of vectors returned by query fetch | Default: `5` |

### 🛠️ Host Deployment Optimization (e.g., Render Free Tier)
By default, `EMBEDDING_PROVIDER=gemini`. This handles embeddings via Gemini's API instead of spinning up a local PyTorch instance.

**Why this matters for engineering:** `sentence-transformers` loads heavy PyTorch dependencies consuming **400MB–600MB RAM** instantly on model load. On a resource-constrained platform like the Render Free Plan (512MB RAM cap), this triggers an immediate `Instance failed: Ran out of memory` crash. 

Local tracking is left as an opt-in config (via `requirements-local-embeddings.txt`). API-based processing optimizes hosting limits for quick, zero-cost portfolios, while local execution allows fully local privacy.

---

## ⚠️ Known Limitations

*   **SQLite & Local Chroma Storage:** Ideal for development or single portfolio profiles. Production vertical or horizontal scaling needs migration to a dedicated engine like PostgreSQL + `pgvector` or an external service (Pinecone / Weaviate).
*   **Keyword Evaluation Over Semantic Evaluation:** The metrics harness uses strict keyword mapping. A natural upgrade path includes introducing LLM-graded semantic variance assessments.
*   **Block API Responses:** The interface awaits complete backend generation cycles before displaying answers. Implementing real-time streaming tokens is next on the technical roadmap.
