from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import CHUNK_SIZE, CHUNK_OVERLAP


_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
)


def chunk_pages(pages: list[dict]) -> list[dict]:
    """Split page texts into chunks, preserving page number metadata."""
    chunks: list[dict] = []
    for page_data in pages:
        page_num = page_data["page"]
        splits = _splitter.split_text(page_data["text"])
        for split in splits:
            chunks.append({"page": page_num, "text": split})
    return chunks
