import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api/client'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.analyticsOverview().then(setData).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="System-wide ingestion, chat, and latency metrics for your workspace."
      />

      {error && <ErrorBanner message={error} />}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Documents Indexed" value={data.documentsReady} sub={`${data.documentsUploaded} uploaded total`} />
            <MetricCard label="Chunks in Vector Store" value={data.totalChunksIndexed} sub="Searchable passages" />
            <MetricCard label="Chat Sessions" value={data.chatSessions} sub={`${data.assistantMessages} assistant replies`} />
            <MetricCard label="Avg Response Latency" value={`${data.avgResponseLatencyMs}ms`} sub="Retrieval + generation" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 panel">
              <div className="panel-header">
                <div>
                  <div className="font-medium text-sm">Response Latency Trend</div>
                  <div className="label-tag mt-0.5">Last 20 assistant turns</div>
                </div>
              </div>
              <div className="p-5" style={{ height: 260 }}>
                {data.latencyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.latencyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                      <XAxis dataKey="turn" tick={{ fontSize: 11, fill: '#8B98A9' }} stroke="#2A3441" />
                      <YAxis tick={{ fontSize: 11, fill: '#8B98A9' }} stroke="#2A3441" />
                      <Tooltip contentStyle={{ background: '#10161F', border: '1px solid #2A3441', borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="latencyMs" stroke="#5EEAD4" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyHint text="No chat turns yet — start a conversation to see latency data here." />
                )}
              </div>
            </div>

            <div className="panel p-6 flex flex-col justify-between">
              <div>
                <div className="font-medium text-sm mb-1">Get started</div>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Upload a document, then ask a question in Chat mode or Agent mode to see
                  the full retrieval trace.
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-6">
                <Link to="/documents" className="btn-secondary justify-center">Upload a document</Link>
                <Link to="/chat" className="btn-primary justify-center">Start chatting</Link>
              </div>
            </div>
          </div>

          {data.documentsFailed > 0 && (
            <div className="mt-6 text-sm text-amber-glow bg-amber-glow/10 border border-amber-glow/30 rounded-md px-4 py-3">
              {data.documentsFailed} document(s) failed to process — check the Documents page for details.
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-primary">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorBanner({ message }) {
  return (
    <div className="mb-6 text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-4 py-3">
      {message}
    </div>
  )
}

export function EmptyHint({ text }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-ink-faint text-center px-6">
      {text}
    </div>
  )
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="panel p-5">
      <div className="label-tag mb-2">{label}</div>
      <div className="metric-figure">{value}</div>
      <div className="text-xs text-ink-faint mt-1">{sub}</div>
    </div>
  )
}
