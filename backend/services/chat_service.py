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
    "If the context doesn't contain the answer, say so. "
    "Always be specific and cite which part of the context you're using."
)


def _build_context_block(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks):
        page_info = f"Page {chunk['page']}" if chunk.get("page") else "Unknown page"
        parts.append(f"[Chunk {i + 1} — {page_info}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


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
            "text_snippet": chunk["text"][:100],
        }
        for i, chunk in enumerate(chunks)
    ]
    yield f"event: sources\ndata: {json.dumps(sources)}\n\n"
    yield "event: done\ndata: {}\n\n"
