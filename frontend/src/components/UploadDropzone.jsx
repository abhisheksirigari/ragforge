import React, { useRef, useState } from 'react'

export default function UploadDropzone({ onFiles, uploading }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length) onFiles(files)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`panel border-dashed cursor-pointer px-8 py-12 flex flex-col items-center text-center transition-colors ${
        dragOver ? 'border-cyan-glow bg-panel2' : ''
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
      <svg width="36" height="36" viewBox="0 0 20 20" fill="none" className="mb-4 text-cyan-glow">
        <path d="M10 3v9M10 3l-3 3M10 3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="text-sm font-medium text-ink-primary mb-1">
        {uploading ? 'Uploading…' : 'Drop files here or click to browse'}
      </div>
      <div className="text-xs text-ink-faint">PDF, DOCX, TXT, or MD — chunked and embedded automatically</div>
    </div>
  )
}
