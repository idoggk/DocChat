# DocChat

Chat with your PDF documents using AI. Upload a document, ask questions, and get cited answers in real time.

![DocChat Screenshot](docs/screenshot.png)

---

## Features

- **PDF upload** with drag-and-drop
- **Semantic search** — finds the most relevant passages for each question
- **Streaming responses** — GPT-4o-mini answers appear token by token
- **Source citations** — every answer links back to the exact pages used
- **Dark / light mode**
- **Session-scoped** — each browser session has its own document library

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Backend | Python 3.11, FastAPI, uvicorn |
| AI | OpenAI GPT-4o-mini + text-embedding-3-small |
| Vector DB | ChromaDB (local, persistent) |
| PDF parsing | PyMuPDF (fitz) |
| Chunking | LangChain RecursiveCharacterTextSplitter |
| Streaming | Server-Sent Events (SSE) |

---

## Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- An OpenAI API key

### 1. Clone the repo

```bash
git clone https://github.com/your-username/docchat.git
cd docchat
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # runs on http://localhost:5173
```

---

## Environment Variables

Create a `.env` file in the **project root** (next to `backend/`):

```
OPENAI_API_KEY=sk-...
```

Optional:
```
CHROMA_PERSIST_DIR=./chroma_data
FRONTEND_URL=http://localhost:5173
```

---

## Architecture — RAG Pipeline

```
PDF upload
    │
    ▼
PyMuPDF (text extraction per page)
    │
    ▼
LangChain RecursiveCharacterTextSplitter
  chunk_size=500, overlap=50
    │
    ▼
OpenAI text-embedding-3-small (batch embed)
    │
    ▼
ChromaDB (persist to ./chroma_data/, scoped by session ID)
    │
    ▼
User asks a question
    │
    ▼
Embed question → cosine similarity search → top 5 chunks
    │
    ▼
GPT-4o-mini (system: context chunks, user: question)
    │
    ▼
Stream SSE tokens → frontend accumulates into message
    │
    ▼
Send sources event (page numbers + snippets)
```

---

## Project Structure

```
docchat/
├── backend/
│   ├── main.py               # FastAPI app + CORS
│   ├── config.py             # Env vars + constants
│   ├── requirements.txt
│   ├── routers/
│   │   ├── documents.py      # Upload, list, delete, suggested questions
│   │   └── chat.py           # SSE streaming chat
│   └── services/
│       ├── pdf_service.py    # PyMuPDF extraction
│       ├── chunking_service.py
│       ├── embedding_service.py
│       ├── vector_service.py # ChromaDB CRUD
│       └── chat_service.py   # RAG pipeline + title generation
└── frontend/
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── WelcomeScreen.jsx
        │   ├── Sidebar.jsx
        │   ├── ChatPanel.jsx
        │   ├── SourceChips.jsx
        │   ├── ThemeToggle.jsx
        │   └── ErrorBoundary.jsx
        ├── hooks/
        │   ├── useDocuments.js
        │   └── useChat.js
        └── context/
            └── ThemeContext.jsx
```

---

## Design Decisions

- **No auth** — UUID session cookie scopes data per browser. Simple enough for a demo; swap in real auth before production.
- **ChromaDB local** — zero infra to run locally. Replace with Pinecone or Weaviate for multi-user scale.
- **SSE over WebSockets** — one-directional streaming is simpler and works over standard HTTP.
- **GPT-4o-mini** — fast and cheap for Q&A over retrieved context. The model never sees the full document, only the top-5 chunks.
- **Chunk size 500 / overlap 50** — balances context richness vs. embedding noise. Tuned for typical contract/report PDFs.
