import chromadb
from chromadb.config import Settings
from config import CHROMA_PERSIST_DIR, TOP_K_RESULTS

_client = chromadb.PersistentClient(
    path=CHROMA_PERSIST_DIR,
    settings=Settings(anonymized_telemetry=False),
)


def _collection_name(session_id: str) -> str:
    return f"session_{session_id}"


def add_document_chunks(
    session_id: str,
    doc_id: str,
    chunks: list[dict],
    embeddings: list[list[float]],
    filename: str,
    created_at: str,
) -> None:
    """Add embedded chunks to ChromaDB under the session collection."""
    collection = _client.get_or_create_collection(
        name=_collection_name(session_id),
        metadata={"hnsw:space": "cosine"},
    )
    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "doc_id": doc_id,
            "filename": filename,
            "page": chunk["page"],
            "created_at": created_at,
        }
        for chunk in chunks
    ]
    documents = [chunk["text"] for chunk in chunks]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas,
    )


def query_similar_chunks(
    session_id: str,
    doc_ids: list[str],
    query_embedding: list[float],
) -> list[dict]:
    """Retrieve top-K similar chunks for a given query within one or more documents."""
    collection = _client.get_or_create_collection(
        name=_collection_name(session_id),
        metadata={"hnsw:space": "cosine"},
    )
    where = {"doc_id": doc_ids[0]} if len(doc_ids) == 1 else {"doc_id": {"$in": doc_ids}}
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=TOP_K_RESULTS,
        where=where,
        include=["documents", "metadatas"],
    )
    chunks: list[dict] = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        chunks.append({"text": doc, "page": meta.get("page"), "filename": meta.get("filename")})
    return chunks


def list_documents_for_session(session_id: str) -> list[dict]:
    """Return unique document metadata entries for a session."""
    try:
        collection = _client.get_collection(name=_collection_name(session_id))
    except Exception:
        return []

    results = collection.get(include=["metadatas"])
    seen: dict[str, dict] = {}
    for meta in results["metadatas"]:
        doc_id = meta["doc_id"]
        if doc_id not in seen:
            seen[doc_id] = meta
    return list(seen.values())


def get_document_metadata(session_id: str, doc_id: str) -> dict | None:
    """Return metadata for a specific document, or None if not found."""
    try:
        collection = _client.get_collection(name=_collection_name(session_id))
    except Exception:
        return None

    results = collection.get(
        where={"doc_id": doc_id},
        include=["metadatas"],
    )
    if not results["metadatas"]:
        return None
    meta = results["metadatas"][0]
    # Count chunks
    chunk_count = len(results["metadatas"])
    return {**meta, "chunk_count": chunk_count}


def get_document_chunks_sample(session_id: str, doc_id: str, n: int = 6) -> list[str]:
    """Return up to n chunk texts from a document, spread across early pages."""
    try:
        collection = _client.get_collection(name=_collection_name(session_id))
    except Exception:
        return []

    results = collection.get(
        where={"doc_id": doc_id},
        include=["documents", "metadatas"],
    )
    if not results["documents"]:
        return []

    # Sort by page so we sample meaningful content pages, not appendix/metadata pages
    paired = sorted(
        zip(results["documents"], results["metadatas"]),
        key=lambda x: x[1].get("page") or 999,
    )
    # Take every Nth chunk to spread coverage across the document
    step = max(1, len(paired) // n)
    sample = [text for text, _ in paired[::step]][:n]
    return sample


def delete_document(session_id: str, doc_id: str) -> bool:
    """Delete all vectors for a document. Returns True if anything was deleted."""
    try:
        collection = _client.get_collection(name=_collection_name(session_id))
    except Exception:
        return False

    results = collection.get(where={"doc_id": doc_id})
    if not results["ids"]:
        return False
    collection.delete(ids=results["ids"])
    return True
