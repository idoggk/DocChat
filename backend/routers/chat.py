import json

from fastapi import APIRouter, Cookie, HTTPException, Response
from fastapi.responses import StreamingResponse

from schemas.chat import ChatRequest
from services.chat_service import rag_stream

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/")
async def chat_with_documents(
    body: ChatRequest,
    response: Response,
    session_id: str | None = Cookie(default=None),
) -> StreamingResponse:
    if not session_id:
        raise HTTPException(status_code=401, detail="No session found. Upload a document first.")
    if not body.doc_ids:
        raise HTTPException(status_code=400, detail="No document IDs provided.")

    async def event_stream():
        try:
            async for event in rag_stream(session_id, body.doc_ids, body.question):
                yield event
        except ValueError as e:
            yield f"event: error\ndata: {json.dumps({'detail': str(e)})}\n\n"
        except Exception:
            yield f"event: error\ndata: {json.dumps({'detail': 'An unexpected error occurred.'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
