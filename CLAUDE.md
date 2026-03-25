# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DocChat is a fullstack RAG (Retrieval-Augmented Generation) app that lets users upload PDF documents, process them into searchable chunks, and chat with them using AI. Built with FastAPI + React (Vite).

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, LangChain, OpenAI (GPT-4o-mini + text-embedding-3-small), ChromaDB, PyMuPDF
- **Frontend:** React 18 (Vite), Tailwind CSS, Axios
- **Streaming:** Server-Sent Events (SSE) for real-time chat responses

## Commands

```bash
# Backend
cd backend && pip install -r requirements.txt     # Install deps
cd backend && uvicorn main:app --reload --port 8000  # Run dev server

# Frontend
cd frontend && npm install       # Install deps
cd frontend && npm run dev       # Run dev server (port 5173)
```

## Architecture

**Backend** (`backend/`): FastAPI app with routers (`documents.py`, `chat.py`) calling into services layer. The RAG pipeline flows: PDF upload -> text extraction (PyMuPDF) -> chunking (LangChain RecursiveCharacterTextSplitter, 500 tokens, 50 overlap) -> embedding (OpenAI text-embedding-3-small) -> ChromaDB storage. Chat queries embed the question, retrieve top 5 chunks via cosine similarity, then stream GPT-4o-mini response as SSE events.

**Frontend** (`frontend/src/`): React SPA with sidebar (document list + upload) and chat panel. Custom hooks (`useChat.js`, `useDocuments.js`) handle SSE streaming and document CRUD. ThemeContext provides dark/light mode via CSS variables.

**Session management:** No auth — UUID session cookie scopes documents per browser session. ChromaDB metadata filters by session ID.

## API Endpoints

- `POST /api/documents/upload` — Upload PDF, process through RAG pipeline
- `GET /api/documents` — List documents for current session
- `GET /api/documents/{doc_id}` — Get document metadata
- `DELETE /api/documents/{doc_id}` — Remove document and vectors
- `POST /api/chat/{doc_id}` — SSE stream: `chunk` (tokens), `sources` (JSON array), `done`
- `GET /api/health` — Health check

## Coding Conventions

- Python: type hints on all functions, async/await for all endpoints, Pydantic models for request/response schemas
- Frontend: functional components only, Tailwind utility classes (avoid custom CSS), dark mode via CSS variables
- Environment variables in `.env`, never hardcode API keys (especially `OPENAI_API_KEY`)
- Validate uploaded files are PDFs, limit upload size to 50MB
- SSE endpoint must set `Content-Type: text/event-stream`
- ChromaDB persist directory: `./chroma_data/`
