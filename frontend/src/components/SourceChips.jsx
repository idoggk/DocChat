import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

function SourceChip({ source, index }) {
  const [expanded, setExpanded] = useState(false)
  const label = `Page ${source.page_number ?? '?'} · Chunk ${source.chunk_index + 1}`

  return (
    <div className="inline-block">
      <button
        onClick={() => setExpanded(e => !e)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors"
      >
        {label}
        {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>
      {expanded && (
        <div className="mt-1 p-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 max-w-sm">
          {source.text_snippet}…
        </div>
      )}
    </div>
  )
}

export default function SourceChips({ sources }) {
  if (!sources || sources.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((s, i) => (
        <SourceChip key={i} source={s} index={i} />
      ))}
    </div>
  )
}
