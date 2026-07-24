import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await signup(email, password, fullName)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr]">
      <div className="hidden lg:flex flex-col justify-between px-14 py-12 border-r border-schematic relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
              <circle cx="6" cy="14" r="2.5" fill="#5EEAD4" />
              <circle cx="14" cy="6" r="2.5" fill="#5EEAD4" opacity="0.6" />
              <circle cx="14" cy="22" r="2.5" fill="#5EEAD4" opacity="0.6" />
              <circle cx="22" cy="14" r="3" fill="#5EEAD4" />
              <path d="M8.2 12.8L12 7.5M8.2 15.2L12 20.5M16.3 7.2L20 12.5M16.3 20.8L20 15.5" stroke="#2A3441" strokeWidth="1.5" />
            </svg>
            <span className="font-mono font-bold text-ink-primary tracking-tight">RAGForge</span>
          </div>

          <h1 className="text-4xl font-semibold leading-tight text-ink-primary max-w-md">
            Answers grounded in your documents, traced end to end.
          </h1>
          <p className="mt-4 text-ink-muted max-w-md leading-relaxed">
            Upload documents, ask questions, and watch the retrieval path — every chunk,
            tool call, and citation the agent used to reach its answer.
          </p>
        </div>

        <RetrievalTraceAnimation />

        <div className="label-tag">Local embeddings · Vector search · Tool-calling agent</div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <circle cx="6" cy="14" r="2.5" fill="#5EEAD4" />
              <circle cx="22" cy="14" r="3" fill="#5EEAD4" />
              <path d="M8.2 12.8L12 7.5M8.2 15.2L12 20.5" stroke="#2A3441" strokeWidth="1.5" />
            </svg>
            <span className="font-mono font-bold text-ink-primary">RAGForge</span>
          </div>

          <h2 className="text-xl font-semibold mb-1">
            {mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}
          </h2>
          <p className="text-sm text-ink-muted mb-6">
            {mode === 'login' ? "Don't have one yet?" : 'Already have a workspace?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-cyan-glow hover:underline"
            >
              {mode === 'login' ? 'Create one' : 'Sign in instead'}
            </button>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label-tag block mb-1.5">Full name</label>
                <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Lovelace" />
              </div>
            )}
            <div>
              <label className="label-tag block mb-1.5">Email</label>
              <input type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <label className="label-tag block mb-1.5">Password</label>
              <input type="password" required minLength={8} className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>

            {error && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function RetrievalTraceAnimation() {
  const nodes = [
    { id: 'query', x: 20, y: 60, label: 'Query' },
    { id: 'search', x: 100, y: 20, label: 'Vector Search' },
    { id: 'chunks', x: 180, y: 60, label: 'Chunks' },
    { id: 'llm', x: 260, y: 20, label: 'LLM' },
    { id: 'answer', x: 340, y: 60, label: 'Answer' },
  ]
  const edges = [['query', 'search'], ['search', 'chunks'], ['chunks', 'llm'], ['llm', 'answer']]
  const find = (id) => nodes.find((n) => n.id === id)

  return (
    <svg viewBox="0 0 380 100" className="w-full max-w-md mt-10 mb-6" aria-hidden="true">
      {edges.map(([a, b], i) => {
        const from = find(a)
        const to = find(b)
        return (
          <line
            key={i}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke="#2A3441" strokeWidth="1.5"
            className="trace-line-flowing"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        )
      })}
      {nodes.map((n, i) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r="14" fill="#10161F" stroke="#5EEAD4" strokeWidth="1.5"
            className="trace-active" style={{ animationDelay: `${i * 0.3}s` }} />
          <circle cx={n.x} cy={n.y} r="4" fill="#5EEAD4" />
          <text x={n.x} y={n.y + 28} textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono, monospace" fill="#8B98A9">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
