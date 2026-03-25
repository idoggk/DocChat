import fitz  # PyMuPDF


def extract_text_from_pdf(pdf_bytes: bytes) -> list[dict]:
    """Extract text from PDF bytes, returning a list of {page, text} dicts."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages: list[dict] = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text()
        if text.strip():
            pages.append({"page": page_num, "text": text})
    doc.close()
    return pages
