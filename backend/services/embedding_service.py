from openai import AsyncOpenAI
from config import OPENAI_API_KEY, EMBEDDING_MODEL

_client = AsyncOpenAI(api_key=OPENAI_API_KEY)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Return embeddings for a list of texts."""
    response = await _client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


async def embed_query(query: str) -> list[float]:
    """Return embedding for a single query string."""
    embeddings = await embed_texts([query])
    return embeddings[0]
