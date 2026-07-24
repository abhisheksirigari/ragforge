import React from 'react'

export default function CitationBadge({ citation, index }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-schematic bg-void px-3 py-2.5">
      <div className="font-mono text-[11px] text-cyan-glow border border-cyan-glow/30 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
        {index + 1}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs text-ink-muted mb-1">
          <span className="font-medium text-ink-primary truncate">{citation.filename}</span>
          <span className="text-ink-faint">chunk {citation.chunk_index}</span>
          <span className="ml-auto font-mono text-cyan-glow shrink-0">{Math.round(citation.score * 100)}%</span>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">{citation.snippet}</p>
      </div>
    </div>
  )
}
