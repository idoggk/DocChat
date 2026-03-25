import { useRef } from 'react'
import { Upload, FileText, Trash2, Loader2, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Sidebar({ documents, loading, uploading, error, activeDocId, onSelect, onUpload, onDelete, onClose }) {
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    await onUpload(file)
  }

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">DocChat</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Upload */}
      <div className="px-3 py-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Processing…' : 'Upload PDF'}
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <p className="px-2 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Documents
        </p>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        )}

        {!loading && documents.length === 0 && (
          <p className="px-2 py-4 text-xs text-slate-400 dark:text-slate-500 text-center">
            No documents yet.<br />Upload a PDF to get started.
          </p>
        )}

        {documents.map(doc => (
          <div
            key={doc.doc_id}
            onClick={() => onSelect(doc)}
            className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer mb-0.5 ${
              activeDocId === doc.doc_id
                ? 'bg-blue-50 dark:bg-blue-900/30'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText
              size={15}
              className={activeDocId === doc.doc_id ? 'text-blue-600 dark:text-blue-400 shrink-0' : 'text-slate-400 shrink-0'}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${
                activeDocId === doc.doc_id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {doc.filename}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {formatDate(doc.created_at)}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(doc.doc_id) }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
