import { useState, useCallback } from 'react'

export function useChat(docId) {
  const [messages, setMessages] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState(null)

  const sendMessage = useCallback(async (question) => {
    if (!docId || streaming) return

    const userMsg = { id: Date.now(), role: 'user', text: question }
    const aiMsg = { id: Date.now() + 1, role: 'ai', text: '', sources: null, done: false }

    setMessages(prev => [...prev, userMsg, aiMsg])
    setStreaming(true)
    setError(null)

    try {
      const response = await fetch(`/api/chat/${docId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

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
      setError(e.message || 'Chat failed.')
      setMessages(prev => prev.map(m =>
        m.id === aiMsg.id ? { ...m, text: 'Something went wrong. Please try again.', done: true } : m
      ))
    } finally {
      setStreaming(false)
    }
  }, [docId, streaming])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, streaming, error, sendMessage, clearMessages }
}
