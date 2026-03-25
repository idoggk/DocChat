import { useState, useRef, useEffect } from 'react'
import { Send, Square, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import axios from 'axios'
import { useChat } from '../hooks/useChat'
import SourceChips from './SourceChips'

const FALLBACK_QUESTIONS = [
  'What is this document about?',
  'Summarize the key points.',
  'What are the main topics covered?',
  'List any important dates or numbers.',
]

function useSuggestedQuestions(docId) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!docId) { setQuestions([]); return }
    setLoading(true)
    setQuestions([])
    axios.get(`/api/documents/${docId}/questions`, { withCredentials: true })
      .then(res => setQuestions(res.data.questions || FALLBACK_QUESTIONS))
      .catch(() => setQuestions(FALLBACK_QUESTIONS))
      .finally(() => setLoading(false))
  }, [docId])

  return { questions, loading }
}

function MarkdownContent({ text }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
        code: ({ inline, children }) =>
          inline
            ? <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-xs">{children}</code>
            : <pre className="mt-1 mb-2 p-2 rounded-lg bg-black/10 dark:bg-white/10 font-mono text-xs overflow-x-auto whitespace-pre-wrap"><code>{children}</code></pre>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-current pl-3 opacity-75 my-1">{children}</blockquote>,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

function BotAvatar({ isStreaming }) {
  return (
    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
      isStreaming ? 'bg-blue-500' : 'bg-blue-600'
    }`}>
      {isStreaming ? (
        <span className="inline-flex gap-0.5 items-center">
          <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
        </span>
      ) : (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 14a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 7.5 17 1.5 1.5 0 0 0 9 15.5 1.5 1.5 0 0 0 7.5 14m9 0a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 16.5 14M3 21l2.5-3h13l2.5 3H3z"/>
        </svg>
      )}
    </div>
  )
}

function UserAvatar() {
  return (
    <div className="shrink-0 w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 fill-current">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    </div>
  )
}

function Message({ msg, isStreaming }) {
  const isAI = msg.role === 'ai'
  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      {isAI ? <BotAvatar isStreaming={isStreaming && !msg.done} /> : <UserAvatar />}
      <div className={`max-w-[75%] ${isAI ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm'
            : 'bg-blue-600 text-white rounded-tr-sm'
        }`}>
          {isAI && !msg.done && !msg.text ? (
            <span className="inline-flex gap-1 items-center py-0.5">
              <span className="w-1.5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          ) : isAI ? (
            <MarkdownContent text={msg.text} />
          ) : (
            msg.text
          )}
        </div>
        {isAI && msg.done && <SourceChips sources={msg.sources} />}
      </div>
    </div>
  )
}

export default function ChatPanel({ activeDoc }) {
  const { messages, streaming, sendMessage, clearMessages, abort } = useChat(activeDoc?.doc_id)
  const { questions, loading: questionsLoading } = useSuggestedQuestions(activeDoc?.doc_id)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    clearMessages()
  }, [activeDoc?.doc_id])

  const submit = () => {
    const q = input.trim()
    if (!q || streaming) return
    setInput('')
    sendMessage(q)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  if (!activeDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <MessageSquare size={26} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Select a document to chat</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
          Click a document in the sidebar to start chatting with it.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 min-h-0">
      {/* Doc header */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{activeDoc.filename}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Ask anything about this document</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="pt-6">
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 mb-4">
              {questionsLoading ? 'Generating questions…' : 'Suggested questions'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {questionsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-7 w-48 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  ))
                : questions.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 rounded-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))
              }
            </div>
          </div>
        )}

        {messages.map(msg => <Message key={msg.id} msg={msg} isStreaming={streaming} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-none outline-none max-h-32"
            style={{ lineHeight: '1.5rem' }}
          />
          {streaming ? (
            <button
              onClick={abort}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="Stop generating"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!input.trim()}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors"
            >
              <Send size={14} />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
