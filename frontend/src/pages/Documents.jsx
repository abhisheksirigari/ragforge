import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import UploadDropzone from '../components/UploadDropzone'
import { PageHeader, ErrorBanner, EmptyHint } from './Dashboard'

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const data = await api.listDocuments()
      setDocs(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function handleFiles(files) {
    setUploading(true)
    setError('')
    for (const file of files) {
      try {
        await api.uploadDocument(file)
      } catch (e) {
        setError(`${file.name}: ${e.message}`)
      }
    }
    setUploading(false)
    refresh()
  }

  async function handleDelete(id) {
    try {
      await api.deleteDocument(id)
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Upload source material — each file is chunked, embedded locally, and indexed for retrieval."
      />

      {error && <ErrorBanner message={error} />}

      <div className="mb-8">
        <UploadDropzone onFiles={handleFiles} uploading={uploading} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="font-medium text-sm">Library</div>
          <div className="label-tag">{docs.length} document(s)</div>
        </div>

        {loading ? (
          <div className="p-8"><EmptyHint text="Loading…" /></div>
        ) : docs.length === 0 ? (
          <div className="p-10"><EmptyHint text="No documents yet. Upload one above to start building your knowledge base." /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-schematic">
                <th className="text-left font-normal label-tag px-5 py-3">Filename</th>
                <th className="text-left font-normal label-tag px-5 py-3">Type</th>
                <th className="text-left font-normal label-tag px-5 py-3">Chunks</th>
                <th className="text-left font-normal label-tag px-5 py-3">Status</th>
                <th className="text-left font-normal label-tag px-5 py-3">Uploaded</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b border-schematic last:border-0">
                  <td className="px-5 py-3.5 text-ink-primary">{d.filename}</td>
                  <td className="px-5 py-3.5 text-ink-muted font-mono text-xs uppercase">{d.file_type}</td>
                  <td className="px-5 py-3.5 text-ink-muted font-mono">{d.chunk_count}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={d.status} error={d.error_message} />
                  </td>
                  <td className="px-5 py-3.5 text-ink-faint text-xs">
                    {new Date(d.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-ink-faint hover:text-danger transition-colors text-xs font-mono"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status, error }) {
  const cls = status === 'ready' ? 'badge-ready' : status === 'failed' ? 'badge-failed' : 'badge-processing'
  return (
    <span className={`badge ${cls}`} title={error || ''}>
      {status}
    </span>
  )
}
