from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str
    doc_ids: list[str]


class SourceChunk(BaseModel):
    text: str
    page: int | None = None
