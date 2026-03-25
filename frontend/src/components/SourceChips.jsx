import { useState, useEffect } from 'react'
import { FileText, X, BookOpen } from 'lucide-react'

function SourceModal({ source, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const page = source.page_number ?? source.page

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-blue-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {page ? `Page ${page}` : 'Source'}
              </p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">
                {source.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 max-h-80 overflow-y-auto">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {source.text_snippet}
          </p>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            This excerpt was retrieved from the document to answer your question.
          </p>
        </div>
      </div>
    </div>
  )
}

function SourceChip({ source, index }) {
  const [open, setOpen] = useState(false)
  const page = source.page_number ?? source.page

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors text-left max-w-[200px]"
      >
        <FileText size={11} className="shrink-0 text-blue-500 mt-0.5" />
        <span className="flex flex-col min-w-0">
          <span className="font-semibold text-blue-600 dark:text-blue-400 leading-tight">
            {page ? `Page ${page}` : `Source ${(source.chunk_index ?? index) + 1}`}
          </span>
          {source.title && (
            <span className="text-slate-500 dark:text-slate-400 font-normal leading-tight truncate">
              {source.title.length > 45 ? source.title.slice(0, 45) + '…' : source.title}
            </span>
          )}
        </span>
      </button>

      {open && <SourceModal source={source} onClose={() => setOpen(false)} />}
    </>
  )
}

export default function SourceChips({ sources }) {
  if (!sources || sources.length === 0) return null
  return (
    <div className="mt-2">
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">Sources used:</p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s, i) => (
          <SourceChip key={i} source={s} index={i} />
        ))}
      </div>
    </div>
  )
}
