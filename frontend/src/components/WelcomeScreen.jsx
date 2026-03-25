import { useRef, useState } from 'react'
import { Upload, FileText, Zap, Search, MessageSquare, Loader2 } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const FEATURES = [
  { icon: Upload,        text: 'Upload any PDF document'         },
  { icon: Search,        text: 'AI-powered semantic search'      },
  { icon: MessageSquare, text: 'Chat and get cited answers'      },
]

export default function WelcomeScreen({ onUpload, uploading, error }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.toLowerCase().endsWith('.pdf')) onUpload(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) { onUpload(file); e.target.value = '' }
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 min-h-0">
      {/* Top bar */}
      <div className="flex justify-end px-4 py-3">
        <ThemeToggle />
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Logo + title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            DocChat
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-base mb-10 text-center max-w-sm">
          Upload a PDF and have a conversation with it using AI.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            w-full max-w-md border-2 border-dashed rounded-2xl px-8 py-12 text-center cursor-pointer transition-all
            ${dragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-slate-900'}
            ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <>
              <Loader2 size={36} className="mx-auto mb-3 text-blue-500 animate-spin" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Processing PDF…</p>
              <p className="text-xs text-slate-400 mt-1">Chunking and embedding your document</p>
            </>
          ) : (
            <>
              <FileText size={36} className={`mx-auto mb-3 ${dragging ? 'text-blue-500' : 'text-slate-400'}`} />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {dragging ? 'Drop it here' : 'Drop your PDF here'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">or click to browse · max 50MB</p>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center mt-10">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              <Icon size={12} className="text-blue-500" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
