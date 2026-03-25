import { useRef, useState } from 'react'
import { Upload, FileText, Zap, Search, MessageSquare, Loader2 } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const FEATURES = [
  { icon: Upload,        text: 'Upload any PDF',       color: 'text-blue-500'   },
  { icon: Search,        text: 'Semantic search',      color: 'text-violet-500' },
  { icon: MessageSquare, text: 'Cited AI answers',     color: 'text-cyan-500'   },
]

export default function WelcomeScreen({ onUpload, uploading, uploadProgress, error }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.toLowerCase().endsWith('.pdf')) onUpload(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) { onUpload(file); e.target.value = '' }
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-slate-950">

      {/* ── Dot grid background ── */}
      <div
        className="absolute inset-0 opacity-50 dark:opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Vignette over grid so edges fade out */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_30%,white_100%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_30%,#020817_100%)]" />

      {/* ── Animated color blobs ── */}
      <div
        className="absolute -top-40 -left-32 w-[550px] h-[550px] rounded-full blur-3xl animate-blob"
        style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.28) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -top-10 -right-40 w-[460px] h-[460px] rounded-full blur-3xl animate-blob"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 70%)', animationDelay: '2.8s' }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-3xl animate-blob"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 70%)', animationDelay: '5.5s' }}
      />

      {/* ── Top bar ── */}
      <div className="relative z-10 flex justify-end px-4 py-3">
        <ThemeToggle />
      </div>

      {/* ── Center content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12">

        {/* Logo + title */}
        <div
          className="animate-fade-up flex flex-col items-center mb-2"
          style={{ animationDelay: '0ms' }}
        >
          {/* Glowing icon */}
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-3xl blur-xl opacity-60 scale-125 bg-gradient-to-br from-blue-400 to-violet-500" />
            <div className="relative w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl animate-float bg-gradient-to-br from-blue-500 to-violet-600">
              <Zap size={28} className="text-white drop-shadow" />
            </div>
          </div>

          {/* Gradient headline */}
          <h1 className="text-5xl font-extrabold tracking-tight text-gradient">
            DocChat
          </h1>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
              GPT-4o · RAG-powered
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <p
          className="animate-fade-up text-slate-500 dark:text-slate-400 text-base text-center max-w-xs mt-5 mb-10 leading-relaxed"
          style={{ animationDelay: '110ms' }}
        >
          Upload a PDF and have a real conversation with it — with cited sources.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            animate-fade-up
            relative w-full max-w-md rounded-2xl px-8 py-12 text-center
            border-2 transition-all duration-300 select-none
            ${dragging
              ? 'cursor-copy border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 scale-[1.02] shadow-xl shadow-blue-500/15'
              : uploading
                ? 'cursor-not-allowed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md'
                : 'cursor-pointer border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md hover:border-blue-400 dark:hover:border-blue-600 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/10 animate-glow-ring'
            }
          `}
          style={{ animationDelay: '220ms' }}
        >
          {/* Shimmer top border line */}
          {!uploading && !dragging && (
            <div className="absolute top-0 left-8 right-8 h-px shimmer-border rounded-full" />
          )}

          {uploading ? (
            <>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {uploadProgress > 0 && uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : 'Processing PDF…'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {uploadProgress < 100 ? 'Transferring your file' : 'Chunking and embedding document'}
              </p>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4 h-1.5 w-52 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className={`
                mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200
                ${dragging
                  ? 'bg-blue-100 dark:bg-blue-900/40 scale-110'
                  : 'bg-slate-100 dark:bg-slate-800 group-hover:scale-110'
                }
              `}>
                <FileText
                  size={26}
                  className={`transition-colors ${dragging ? 'text-blue-500' : 'text-slate-400'}`}
                />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                {dragging ? 'Drop it here!' : 'Drop your PDF here'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                or <span className="text-blue-500 font-medium">click to browse</span> · max 50 MB
              </p>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

        {/* Error */}
        {error && (
          <p className="animate-fade-up mt-3 text-sm text-red-500 dark:text-red-400 font-medium">
            {error}
          </p>
        )}

        {/* Feature pills */}
        <div
          className="animate-fade-up flex flex-wrap gap-2.5 justify-center mt-9"
          style={{ animationDelay: '340ms' }}
        >
          {FEATURES.map(({ icon: Icon, text, color }) => (
            <div
              key={text}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 shadow-sm backdrop-blur-sm"
            >
              <Icon size={12} className={color} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
