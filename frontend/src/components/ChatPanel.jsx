import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, MessageSquare } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import SourceChips from './SourceChips'

const SUGGESTED = [
  'What is this document about?',
  'Summarize the key points.',
  'What are the main conclusions?',
  'List any important dates or numbers.',
]

function Message({ msg }) {
  const isAI = msg.role === 'ai'
  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
        isAI ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
      }`}>
        {isAI
          ? <Bot size={14} className="text-white" />
          : <User size={14} className="text-slate-600 dark:text-slate-300" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isAI ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isAI
            ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm'
            : 'bg-blue-600 text-white rounded-tr-sm'
        }`}>
          {msg.text || (isAI && !msg.done
            ? <span className="inline-flex gap-1 items-center py-0.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            : null
          )}
        </div>
        {isAI && msg.done && <SourceChips sources={msg.sources} />}
      </div>
    </div>
  )
}

export default function ChatPanel({ activeDoc }) {
  const { messages, streaming, sendMessage, clearMessages } = useChat(activeDoc?.doc_id)
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

  /* ── No doc selected ── */
  if (!activeDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <MessageSquare size={26} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Upload a PDF to get started</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
          Select a document from the sidebar or upload a new one to start chatting.
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
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 mb-4">Suggested questions</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 rounded-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
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
          <button
            onClick={submit}
            disabled={!input.trim() || streaming}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors"
          >
            {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
