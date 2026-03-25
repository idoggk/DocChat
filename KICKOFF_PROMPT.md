# DocChat — Kickoff Prompt for Claude Code

## How to use this file

1. Create a new folder on your computer called `docchat`
2. Copy the CLAUDE.md file into that folder
3. Open the folder in VS Code
4. Open Claude Code (terminal or VS Code extension)
5. Paste the "Phase 1" prompt below and let Claude Code build it
6. When Phase 1 is done and working, paste Phase 2, then Phase 3

---

## PHASE 1: Backend Foundation
Paste this into Claude Code first:

```
I'm building DocChat — a RAG app for chatting with PDF documents. Read the CLAUDE.md file first to understand the full project.

Let's start with the backend foundation. Please:

1. Create the project structure as defined in CLAUDE.md (backend/ folder with all subfolders)
2. Set up requirements.txt with these exact packages:
   - fastapi
   - uvicorn[standard]
   - python-multipart
   - pymupdf
   - chromadb
   - openai
   - langchain
   - langchain-text-splitters
   - python-dotenv
   - pydantic
3. Create config.py that loads OPENAI_API_KEY from .env
4. Create a .env.example file showing what env vars are needed
5. Implement the PDF service (extract text from uploaded PDF using PyMuPDF)
6. Implement the chunking service (RecursiveCharacterTextSplitter, 500 tokens, 50 overlap)
7. Implement the embedding service (OpenAI text-embedding-3-small)
8. Implement the vector service (ChromaDB operations: create collection, add documents, query)
9. Implement the documents router with upload, list, get, and delete endpoints
10. Create the main.py with CORS middleware allowing localhost:5173
11. Create Pydantic schemas for all request/response models

After building, run the server with uvicorn and verify it starts without errors. Then test the upload endpoint by describing what a curl command would look like.

Important: Use async/await for all endpoints. Add type hints everywhere. Handle errors with proper HTTP status codes and messages.
```

---

## PHASE 2: Chat & RAG Pipeline
Paste this after Phase 1 is working:

```
Phase 1 is complete. Now let's build the chat and RAG pipeline.

Please:

1. Implement the chat service with this exact flow:
   a. Take user question + doc_id
   b. Embed the question using the same OpenAI embedding model
   c. Query ChromaDB for top 5 most similar chunks for that doc_id
   d. Build a prompt with this structure:
      - System message: "You are a helpful assistant that answers questions about documents. Use ONLY the provided context to answer. If the context doesn't contain the answer, say so. Always be specific and cite which part of the context you're using."
      - Context: the retrieved chunks with their page numbers
      - User question
   e. Call GPT-4o-mini with streaming enabled
   f. Yield tokens as SSE events

2. Implement the chat router:
   - POST /api/chat/{doc_id} endpoint
   - Accept JSON body with "question" field
   - Return StreamingResponse with media_type="text/event-stream"
   - Send three types of events:
     - "chunk" events with each text token
     - "sources" event with JSON array of source chunks (page_number, chunk_index, text_snippet of first 100 chars)
     - "done" event when complete

3. Add session management:
   - Middleware that checks for session cookie, creates UUID if missing
   - Set httponly cookie with session ID
   - Filter all document/chat operations by session ID

4. Add a /api/health endpoint

After building, verify the server still starts. Walk me through how to test the full pipeline: upload a PDF, then ask a question about it.
```

---

## PHASE 3: Frontend
Paste this after Phase 2 is working:

```
Backend is complete with upload, chunking, embedding, retrieval, and streaming chat. Now build the frontend.

Please:

1. Create a new Vite + React project in the frontend/ folder:
   - npm create vite@latest frontend -- --template react
   - Install: tailwindcss, axios, lucide-react (for icons)
   - Configure Tailwind with dark mode class strategy
   - Set up Vite proxy to forward /api requests to localhost:8000

2. Build the ThemeContext and ThemeToggle:
   - Store preference in localStorage
   - Toggle dark class on document.documentElement
   - Sun/Moon icon toggle

3. Build the main layout (App.jsx):
   - Left sidebar (280px) with document list and upload button
   - Right panel with chat area
   - Responsive — sidebar collapsible on mobile

4. Build the Sidebar:
   - Upload button at top that opens a file input (accept .pdf only)
   - On file select, POST to /api/documents/upload with FormData
   - Show upload progress/loading state
   - List all documents from GET /api/documents
   - Active document highlighted
   - Show doc name, page count, upload time
   - Click a doc to select it for chat

5. Build the ChatPanel:
   - Message list with auto-scroll to bottom
   - AI messages on left with blue avatar, user messages on right
   - Input bar at bottom with send button
   - When sending: POST to /api/chat/{doc_id} and handle SSE stream
   - Accumulate streamed tokens into the AI message in real-time
   - After stream completes, show source chips below the message

6. Build SourceChips component:
   - Small badges showing "Page X · Chunk Y"
   - Expandable — click to see the source text snippet

7. Style everything with Tailwind:
   - Clean, minimal design
   - Dark mode: dark backgrounds, light text
   - Light mode: white backgrounds, dark text
   - Smooth transitions between themes
   - Professional feel — think linear.app or notion.so aesthetic

8. Handle edge cases:
   - No document selected: show "Upload a PDF to get started" placeholder
   - Empty chat: show suggested questions
   - Error states: upload failed, chat failed, etc.
   - Loading states: uploading, processing, waiting for response

After building, run npm run dev and verify the app loads. Walk me through the full user flow: upload → chat → see sources.
```

---

## PHASE 4: Polish & Deploy Prep
Paste this after Phase 3 is working:

```
The app is functional. Let's polish it for demo/interview readiness.

Please:

1. Add a welcome screen when no documents are uploaded:
   - App name "DocChat" with a brief tagline
   - Drag-and-drop upload zone
   - Brief explanation of what the app does

2. Add suggested starter questions after uploading a doc:
   - "What is this document about?"
   - "Summarize the key points"
   - "What are the main topics covered?"
   - Make them clickable to auto-send

3. Add a simple README.md with:
   - Project description
   - Screenshots placeholder
   - Setup instructions (clone, install, env vars, run)
   - Tech stack section
   - Architecture section explaining the RAG pipeline
   - What I learned / design decisions section

4. Add error boundary and 404 handling

5. Review all code for:
   - Consistent error handling
   - No hardcoded values
   - Clean imports (no unused)
   - Proper loading states everywhere

6. Create a .gitignore covering:
   - node_modules, __pycache__, .env, chroma_data/, dist/

Let me know what the final file count is and confirm everything runs cleanly.
```

---

## Tips While Building

- If Claude Code gets stuck or something breaks, paste the error message and say "fix this"
- After each phase, do a quick manual test before moving to the next
- Use `/clear` between phases to keep context fresh
- If the UI doesn't look right, take a screenshot and paste it into Claude Code
- If you hit Claude Pro usage limits, take a break and come back — limits reset