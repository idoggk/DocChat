from pydantic import BaseModel
from datetime import datetime


class DocumentUploadResponse(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    created_at: datetime


class DocumentMetadata(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    created_at: datetime


class DocumentListResponse(BaseModel):
    documents: list[DocumentMetadata]


class DeleteResponse(BaseModel):
    message: str
