import { useState, useCallback, useEffect, useRef } from 'react'

function storageKey(docId) {
  return docId ? `chat_${docId}` : null
}

function loadMessages(key) {
  if (!key) return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const msgs = JSON.parse(raw)
    return msgs.filter(m => m.role === 'user' || m.done)
  } catch {
    return []
  }
}

function saveMessages(key, msgs) {
  if (!key) return
  try { localStorage.setItem(key, JSON.stringify(msgs)) } catch { /* ignore */ }
}

export function useChat(docId) {
  const key = storageKey(docId)
  const [messages, setMessages] = useState(() => loadMessages(key))
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const messagesRef = useRef(messages)

  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    setMessages(loadMessages(storageKey(docId)))
    setError(null)
  }, [docId])

  const sendMessage = useCallback(async (question) => {
    if (!docId || streaming) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const base = Date.now()
    const userMsg = { id: `${base}-u`, role: 'user', text: question }
    const aiMsg  = { id: `${base}-a`, role: 'ai',   text: '', sources: null, done: false }

    setMessages(prev => [...prev, userMsg, aiMsg])
    setStreaming(true)
    setError(null)

    try {
      const response = await fetch(`/api/chat/${docId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        let eventType = null
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim()
            try {
              const payload = JSON.parse(raw)
              if (eventType === 'chunk') {
                setMessages(prev => prev.map(m =>
                  m.id === aiMsg.id ? { ...m, text: m.text + payload.text } : m
                ))
              } else if (eventType === 'sources') {
                setMessages(prev => prev.map(m =>
                  m.id === aiMsg.id ? { ...m, sources: payload } : m
                ))
              } else if (eventType === 'done') {
                setMessages(prev => prev.map(m =>
                  m.id === aiMsg.id ? { ...m, done: true } : m
                ))
              } else if (eventType === 'error') {
                throw new Error(payload.detail || 'Stream error')
              }
            } catch (_) { /* non-JSON line, skip */ }
            eventType = null
          }
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === aiMsg.id ? { ...m, done: true } : m
        ))
        return
      }
      setError(e.message || 'Chat failed.')
      setMessages(prev => prev.map(m =>
        m.id === aiMsg.id ? { ...m, text: 'Something went wrong. Please try again.', done: true } : m
      ))
    } finally {
      setStreaming(false)
      saveMessages(storageKey(docId), messagesRef.current)
    }
  }, [docId])

  const abort = useCallback(() => { abortRef.current?.abort() }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    if (key) localStorage.removeItem(key)
  }, [key])

  return { messages, streaming, error, sendMessage, clearMessages, abort }
}
