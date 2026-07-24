import React from 'react'

const STEP_ICONS = {
  retrieve_documents: '◈',
  generate_answer: '◆',
  calculator: '±',
  final_answer: '✓',
  max_turns_reached: '!',
}

export default function TraceView({ trace }) {
  if (!trace || trace.length === 0) return null

  return (
    <div className="rounded-md border border-schematic bg-void px-4 py-3.5">
      <div className="label-tag mb-3">Execution Trace</div>
      <div className="flex items-stretch">
        {trace.map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center text-center w-24 shrink-0">
              <div className="w-8 h-8 rounded-full border border-cyan-glow/40 bg-panel2 flex items-center justify-center text-cyan-glow text-sm font-mono">
                {STEP_ICONS[step.step] || '•'}
              </div>
              <div className="text-[11px] text-ink-primary mt-2 font-medium leading-tight">
                {formatStepName(step.step)}
              </div>
              <div className="text-[10px] text-ink-faint font-mono mt-0.5">{step.duration_ms}ms</div>
            </div>
            {i < trace.length - 1 && (
              <div className="flex-1 flex items-center min-w-4">
                <div className="w-full h-px bg-schematic" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-schematic space-y-1.5">
        {trace.map((step, i) => (
          <div key={i} className="text-xs text-ink-muted flex gap-2">
            <span className="text-cyan-glow font-mono shrink-0">{formatStepName(step.step)}</span>
            <span className="truncate">{step.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatStepName(step) {
  return step.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
}
