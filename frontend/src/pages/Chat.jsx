import React, { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import ChatMessage from '../components/ChatMessage'
import { PageHeader, ErrorBanner } from './Dashboard'

export default function Chat() {
  const [mode, setMode] = useState('rag')
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const question = input.trim()
    if (!question || sending) return

    setInput('')
    setError('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setSending(true)

    try {
      const res = await api.sendChat({ session_id: sessionId, message: question, mode })
      setSessionId(res.session_id)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
        trace: res.trace,
        latency_ms: res.latency_ms,
      }])
    } catch (err) {
      setError(err.message)
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  function startNewSession() {
    setSessionId(null)
    setMessages([])
    setError('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageHeader
        title="Chat"
        subtitle="Ask questions grounded in your uploaded documents."
        action={
          <div className="flex items-center gap-3">
            <ModeToggle mode={mode} setMode={setMode} disabled={messages.length > 0} />
            <button onClick={startNewSession} className="btn-secondary">New session</button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="flex-1 overflow-y-auto pr-1 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-full border border-schematic flex items-center justify-center mb-4 text-cyan-glow">
              ◈
            </div>
            <p className="text-sm text-ink-muted max-w-sm">
              {mode === 'agent'
                ? 'Agent mode can search your documents and run calculations. Ask something like "how much could we save if we cut the idle worker cost by 40%?"'
                : 'Ask a question about anything you\'ve uploaded to Documents.'}
            </p>
          </div>
        ) : (
          messages.map((m, i) => <ChatMessage key={i} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-3">
        <input
          className="input-field"
          placeholder={mode === 'agent' ? 'Ask the agent anything…' : 'Ask a question about your documents…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={sending || !input.trim()}>
          {sending ? 'Thinking…' : 'Send'}
        </button>
      </form>
    </div>
  )
}

function ModeToggle({ mode, setMode, disabled }) {
  return (
    <div className="flex items-center rounded-md border border-schematic overflow-hidden font-mono text-xs">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setMode('rag')}
        className={`px-3 py-1.5 transition-colors ${mode === 'rag' ? 'bg-cyan-glow text-void font-semibold' : 'text-ink-muted hover:text-ink-primary'} disabled:cursor-not-allowed`}
        title={disabled ? 'Start a new session to change mode' : ''}
      >
        RAG
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setMode('agent')}
        className={`px-3 py-1.5 transition-colors ${mode === 'agent' ? 'bg-cyan-glow text-void font-semibold' : 'text-ink-muted hover:text-ink-primary'} disabled:cursor-not-allowed`}
        title={disabled ? 'Start a new session to change mode' : ''}
      >
        Agent
      </button>
    </div>
  )
}
