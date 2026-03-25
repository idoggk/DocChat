import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import WelcomeScreen from './components/WelcomeScreen'
import ErrorBoundary from './components/ErrorBoundary'
import { useDocuments } from './hooks/useDocuments'

export default function App() {
  const [selectedDocIds, setSelectedDocIds] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { documents, loading, uploading, uploadProgress, error, uploadDocument, deleteDocument } = useDocuments()

  const showWelcome = !loading && documents.length === 0

  const handleUpload = async (file) => {
    const doc = await uploadDocument(file)
    if (doc) setSelectedDocIds([doc.doc_id])
  }

  const handleToggleDoc = (doc) => {
    setSelectedDocIds(prev =>
      prev.includes(doc.doc_id)
        ? prev.filter(id => id !== doc.doc_id)
        : [...prev, doc.doc_id]
    )
  }

  const handleDelete = (docId) => {
    deleteDocument(docId)
    setSelectedDocIds(prev => prev.filter(id => id !== docId))
  }

  const selectedDocs = documents.filter(d => selectedDocIds.includes(d.doc_id))

  if (showWelcome) {
    return (
      <ErrorBoundary>
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
          <WelcomeScreen onUpload={handleUpload} uploading={uploading} uploadProgress={uploadProgress} error={error} />
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-30 w-72 md:relative md:z-auto md:flex md:flex-col
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar
            documents={documents}
            loading={loading}
            uploading={uploading}
            uploadProgress={uploadProgress}
            error={error}
            selectedDocIds={selectedDocIds}
            onToggle={(doc) => { handleToggleDoc(doc); setSidebarOpen(false) }}
            onUpload={handleUpload}
            onDelete={handleDelete}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">DocChat</span>
          </div>

          <ErrorBoundary>
            <ChatPanel selectedDocs={selectedDocs} />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  )
}
