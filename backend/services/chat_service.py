import json
from typing import AsyncIterator

from openai import AsyncOpenAI

import services.embedding_service as embedding_service
import services.vector_service as vector_service
from config import CHAT_MODEL, OPENAI_API_KEY

_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

SYSTEM_MESSAGE = (
    "You are a helpful assistant that answers questions about documents. "
    "Use ONLY the provided context to answer. "
    "If the context doesn't contain the answer, say so clearly.\n\n"
    "Formatting rules:\n"
    "- Use markdown formatting in your responses.\n"
    "- For factual summaries, use bullet points.\n"
    "- Use **bold** for key terms or important values.\n"
    "- Use headers (##) only if the answer has multiple distinct sections.\n"
    "- Keep responses concise and easy to scan — avoid long dense paragraphs.\n"
    "- If listing items, always use a bullet list, not a run-on sentence."
)


def _build_context_block(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks):
        page_info = f"Page {chunk['page']}" if chunk.get("page") else "Unknown page"
        parts.append(f"[Chunk {i + 1} — {page_info}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def _is_readable(text: str) -> bool:
    """Return False for chunks that look like metadata/audit trails rather than prose."""
    words = text.split()
    if len(words) < 8:
        return False
    caps_words = sum(1 for w in words if w.isupper() and len(w) > 2)
    if caps_words / len(words) > 0.45:
        return False
    # Reject chunks that are mostly digits/special chars
    alpha_chars = sum(1 for c in text if c.isalpha())
    if alpha_chars / max(len(text), 1) < 0.4:
        return False
    return True


def _extract_title(text: str) -> str:
    """Pull a short readable headline from the start of the chunk."""
    clean = " ".join(text.split())
    for sep in (". ", ".\n", "! ", "? ", ": "):
        idx = clean.find(sep)
        if 15 < idx < 90:
            return clean[: idx + 1]
    return clean[:80] + ("…" if len(clean) > 80 else "")


async def rag_stream(
    session_id: str,
    doc_id: str,
    question: str,
) -> AsyncIterator[str]:
    """Full RAG pipeline: embed question → retrieve chunks → stream GPT response as SSE."""
    query_embedding = await embedding_service.embed_query(question)
    chunks = vector_service.query_similar_chunks(session_id, doc_id, query_embedding)

    if not chunks:
        raise ValueError("Document not found or has no content.")

    context_block = _build_context_block(chunks)
    system_content = f"{SYSTEM_MESSAGE}\n\nContext:\n{context_block}"

    stream = await _client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": question},
        ],
        stream=True,
    )

    async for event in stream:
        delta = event.choices[0].delta
        if delta.content:
            yield f"event: chunk\ndata: {json.dumps({'text': delta.content})}\n\n"

    sources = [
        {
            "chunk_index": i,
            "page_number": chunk.get("page"),
            "title": _extract_title(chunk["text"]),
            "text_snippet": " ".join(chunk["text"].split()),  # full clean text
        }
        for i, chunk in enumerate(chunks)
        if _is_readable(chunk["text"])
    ]
    yield f"event: sources\ndata: {json.dumps(sources)}\n\n"
    yield "event: done\ndata: {}\n\n"
