import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, HTTPException, Request, Response, UploadFile
from openai import AsyncOpenAI

import services.chunking_service as chunking_service
import services.embedding_service as embedding_service
import services.pdf_service as pdf_service
import services.vector_service as vector_service
from config import CHAT_MODEL, MAX_UPLOAD_SIZE_BYTES, OPENAI_API_KEY

_openai = AsyncOpenAI(api_key=OPENAI_API_KEY)
from schemas.documents import (
    DeleteResponse,
    DocumentListResponse,
    DocumentMetadata,
    DocumentUploadResponse,
)

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _get_or_create_session(
    response: Response, session_id: str | None
) -> str:
    if not session_id:
        session_id = str(uuid.uuid4())
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            samesite="lax",
        )
    return session_id


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile,
    response: Response,
    session_id: str | None = Cookie(default=None),
) -> DocumentUploadResponse:
    session_id = _get_or_create_session(response, session_id)

    if file.content_type not in ("application/pdf", "application/octet-stream"):
        if not (file.filename or "").lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 50MB limit.")

    pages = pdf_service.extract_text_from_pdf(pdf_bytes)
    if not pages:
        raise HTTPException(status_code=422, detail="No extractable text found in PDF.")

    chunks = chunking_service.chunk_pages(pages)
    texts = [c["text"] for c in chunks]
    embeddings = await embedding_service.embed_texts(texts)

    doc_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)

    vector_service.add_document_chunks(
        session_id=session_id,
        doc_id=doc_id,
        chunks=chunks,
        embeddings=embeddings,
        filename=file.filename or "unknown.pdf",
        created_at=created_at.isoformat(),
    )

    return DocumentUploadResponse(
        doc_id=doc_id,
        filename=file.filename or "unknown.pdf",
        chunk_count=len(chunks),
        created_at=created_at,
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    response: Response,
    session_id: str | None = Cookie(default=None),
) -> DocumentListResponse:
    session_id = _get_or_create_session(response, session_id)
    raw = vector_service.list_documents_for_session(session_id)
    docs = [
        DocumentMetadata(
            doc_id=m["doc_id"],
            filename=m["filename"],
            chunk_count=0,  # chunk count not stored per-doc in metadata index
            created_at=datetime.fromisoformat(m["created_at"]),
        )
        for m in raw
    ]
    return DocumentListResponse(documents=docs)


@router.get("/{doc_id}", response_model=DocumentMetadata)
async def get_document(
    doc_id: str,
    response: Response,
    session_id: str | None = Cookie(default=None),
) -> DocumentMetadata:
    session_id = _get_or_create_session(response, session_id)
    meta = vector_service.get_document_metadata(session_id, doc_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    return DocumentMetadata(
        doc_id=meta["doc_id"],
        filename=meta["filename"],
        chunk_count=meta["chunk_count"],
        created_at=datetime.fromisoformat(meta["created_at"]),
    )


@router.get("/{doc_id}/questions")
async def get_suggested_questions(
    doc_id: str,
    response: Response,
    session_id: str | None = Cookie(default=None),
) -> dict:
    session_id = _get_or_create_session(response, session_id)
    sample_chunks = vector_service.get_document_chunks_sample(session_id, doc_id, n=6)
    if not sample_chunks:
        raise HTTPException(status_code=404, detail="Document not found.")

    context = "\n\n---\n\n".join(sample_chunks)
    prompt = (
        "Based on the following document excerpts, generate exactly 4 specific, interesting questions "
        "that a user might want to ask about this document. "
        "The questions should be concrete and relevant to the actual content — not generic. "
        "Return ONLY a JSON array of 4 strings, no explanation.\n\n"
        f"Document excerpts:\n{context}"
    )

    completion = await _openai.chat.completions.create(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=300,
    )
    raw = completion.choices[0].message.content.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    questions: list[str] = json.loads(raw.strip())
    return {"questions": questions[:4]}


@router.delete("/{doc_id}", response_model=DeleteResponse)
async def delete_document(
    doc_id: str,
    response: Response,
    session_id: str | None = Cookie(default=None),
) -> DeleteResponse:
    session_id = _get_or_create_session(response, session_id)
    deleted = vector_service.delete_document(session_id, doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")
    return DeleteResponse(message="Document deleted successfully.")
