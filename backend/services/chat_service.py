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
        filename = chunk.get("filename", "")
        source_label = f"{filename} — {page_info}" if filename else page_info
        parts.append(f"[Chunk {i + 1} — {source_label}]\n{chunk['text']}")
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


async def _generate_titles(chunks: list[dict]) -> list[str]:
    """Ask GPT to generate a 4-6 word headline for each chunk in one call."""
    items = "\n\n".join(
        f"[{i + 1}] {' '.join(c['text'].split())[:300]}"
        for i, c in enumerate(chunks)
    )
    prompt = (
        f"For each of the following {len(chunks)} text excerpts, write a 4-6 word headline "
        "that captures its specific topic (e.g. 'Monthly Salary and Payment Terms'). "
        "Return ONLY a JSON array of strings, one per excerpt, in the same order.\n\n"
        + items
    )
    try:
        completion = await _client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=200,
        )
        raw = completion.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1].lstrip("json").strip()
        titles: list[str] = json.loads(raw)
        if len(titles) == len(chunks):
            return titles
    except Exception:
        pass
    # Fallback: first 60 chars of each chunk
    return [" ".join(c["text"].split())[:60] + "…" for c in chunks]


async def rag_stream(
    session_id: str,
    doc_ids: list[str],
    question: str,
) -> AsyncIterator[str]:
    """Full RAG pipeline: embed question → retrieve chunks → stream GPT response as SSE."""
    query_embedding = await embedding_service.embed_query(question)
    chunks = vector_service.query_similar_chunks(session_id, doc_ids, query_embedding)

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

    readable = [
        (i, chunk) for i, chunk in enumerate(chunks) if _is_readable(chunk["text"])
    ]
    titles = await _generate_titles([c for _, c in readable])
    sources = [
        {
            "chunk_index": orig_i,
            "page_number": chunk.get("page"),
            "title": titles[j],
            "text_snippet": " ".join(chunk["text"].split()),
            "filename": chunk.get("filename"),
        }
        for j, (orig_i, chunk) in enumerate(readable)
    ]
    yield f"event: sources\ndata: {json.dumps(sources)}\n\n"
    yield "event: done\ndata: {}\n\n"
