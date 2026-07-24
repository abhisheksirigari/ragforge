import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader, ErrorBanner, EmptyHint } from './Dashboard'

export default function Evaluation() {
  const [summary, setSummary] = useState(null)
  const [question, setQuestion] = useState('')
  const [keywords, setKeywords] = useState('')
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState('')

  async function refresh() {
    try {
      const data = await api.evalSummary()
      setSummary(data)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { refresh() }, [])

  async function handleRun(e) {
    e.preventDefault()
    if (!question.trim()) return
    setRunning(true)
    setError('')
    try {
      const kw = keywords.split(',').map((k) => k.trim()).filter(Boolean)
      const result = await api.runEval({ question, expected_keywords: kw })
      setLastResult(result)
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Evaluation"
        subtitle="Measure whether retrieval actually surfaces relevant content — not just whether the model produced an answer."
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Eval Runs" value={summary?.total_runs ?? '—'} />
        <MetricCard label="Hit Rate" value={summary ? `${Math.round(summary.hit_rate * 100)}%` : '—'} />
        <MetricCard label="Avg Precision@K" value={summary ? summary.avg_precision_at_k : '—'} />
        <MetricCard label="Avg Latency" value={summary ? `${summary.avg_latency_ms}ms` : '—'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel p-6">
          <div className="font-medium text-sm mb-1">Run a retrieval test</div>
          <p className="text-xs text-ink-muted mb-4 leading-relaxed">
            Enter a question and the keywords you'd expect a correct answer to be grounded in.
            RAGForge checks whether any retrieved chunk actually contains them.
          </p>
          <form onSubmit={handleRun} className="space-y-3">
            <div>
              <label className="label-tag block mb-1.5">Question</label>
              <input className="input-field" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is our cloud spend driven by?" />
            </div>
            <div>
              <label className="label-tag block mb-1.5">Expected keywords (comma-separated)</label>
              <input className="input-field" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="idle, EC2, RDS" />
            </div>
            <button type="submit" disabled={running} className="btn-primary w-full">
              {running ? 'Running…' : 'Run evaluation'}
            </button>
          </form>

          {lastResult && (
            <div className="mt-5 pt-5 border-t border-schematic space-y-2 text-sm">
              <Row label="Retrieved chunks" value={lastResult.retrieved_count} />
              <Row label="Hit" value={lastResult.hit ? 'Yes' : 'No'} highlight={lastResult.hit} />
              <Row label="Precision@K" value={lastResult.precision_at_k} />
              <Row label="Latency" value={`${lastResult.latency_ms}ms`} />
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="font-medium text-sm">Recent runs</div>
          </div>
          {!summary || summary.recent.length === 0 ? (
            <div className="p-10"><EmptyHint text="No evaluation runs yet — run one to see history here." /></div>
          ) : (
            <div className="divide-y divide-schematic">
              {summary.recent.map((r, i) => (
                <div key={i} className="px-5 py-3.5">
                  <div className="text-sm text-ink-primary truncate mb-1">{r.question}</div>
                  <div className="flex items-center gap-3 text-xs text-ink-muted font-mono">
                    <span className={r.hit ? 'text-cyan-glow' : 'text-ink-faint'}>{r.hit ? 'HIT' : 'MISS'}</span>
                    <span>P@K {r.precision_at_k}</span>
                    <span>{r.retrieved_count} chunks</span>
                    <span className="ml-auto">{r.latency_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="panel p-5">
      <div className="label-tag mb-2">{label}</div>
      <div className="metric-figure">{value}</div>
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={`font-mono ${highlight ? 'text-cyan-glow' : 'text-ink-primary'}`}>{value}</span>
    </div>
  )
}
