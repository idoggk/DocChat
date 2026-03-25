import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import WelcomeScreen from './components/WelcomeScreen'
import ErrorBoundary from './components/ErrorBoundary'
import { useDocuments } from './hooks/useDocuments'

export default function App() {
  const [activeDoc, setActiveDoc] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { documents, loading, uploading, uploadProgress, error, uploadDocument, deleteDocument } = useDocuments()

  const showWelcome = !loading && documents.length === 0

  const handleUpload = async (file) => {
    const doc = await uploadDocument(file)
    if (doc) setActiveDoc({ doc_id: doc.doc_id, filename: doc.filename })
  }

  const handleDelete = (docId) => {
    deleteDocument(docId)
    if (activeDoc?.doc_id === docId) setActiveDoc(null)
  }

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
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

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
            activeDocId={activeDoc?.doc_id}
            onSelect={(doc) => { setActiveDoc(doc); setSidebarOpen(false) }}
            onUpload={handleUpload}
            onDelete={handleDelete}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
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
            <ChatPanel activeDoc={activeDoc} />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  )
}
