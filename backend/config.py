import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set in environment or .env file")

CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
EMBEDDING_MODEL: str = "text-embedding-3-small"
CHAT_MODEL: str = "gpt-4o-mini"
CHUNK_SIZE: int = 500
CHUNK_OVERLAP: int = 50
TOP_K_RESULTS: int = 5
MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50MB
