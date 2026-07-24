import React from 'react'
import CitationBadge from './CitationBadge'
import TraceView from './TraceView'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-2xl bg-cyan-glow/10 border border-cyan-glow/25 rounded-lg rounded-tr-sm px-4 py-3 text-sm text-ink-primary">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-2xl w-full space-y-3">
        <div className="panel rounded-tl-sm px-4 py-3.5">
          <p className="text-sm text-ink-primary leading-relaxed whitespace-pre-wrap">{message.content}</p>
          {typeof message.latency_ms === 'number' && (
            <div className="text-[11px] text-ink-faint font-mono mt-2">{Math.round(message.latency_ms)}ms</div>
          )}
        </div>

        {message.trace?.length > 0 && <TraceView trace={message.trace} />}

        {message.citations?.length > 0 && (
          <div>
            <div className="label-tag mb-2">Sources</div>
            <div className="space-y-2">
              {message.citations.map((c, i) => (
                <CitationBadge key={i} citation={c} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
