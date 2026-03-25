import fitz  # PyMuPDF
from fastapi import HTTPException


def extract_text_from_pdf(pdf_bytes: bytes) -> list[dict]:
    """Extract text from PDF bytes, returning a list of {page, text} dicts."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not open PDF: {e}")

    pages: list[dict] = []
    try:
        for page_num, page in enumerate(doc, start=1):
            text = page.get_text()
            if text.strip():
                pages.append({"page": page_num, "text": text})
    finally:
        doc.close()
    return pages
