import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get('/api/documents', { withCredentials: true })
      setDocuments(data.documents || [])
    } catch (e) {
      setError('Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const uploadDocument = useCallback(async (file) => {
    setUploading(true)
    setUploadProgress(0)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post('/api/documents/upload', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      await fetchDocuments()
      return data
    } catch (e) {
      const msg = e.response?.data?.detail || 'Upload failed.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [fetchDocuments])

  const deleteDocument = useCallback(async (docId) => {
    try {
      await axios.delete(`/api/documents/${docId}`, { withCredentials: true })
      setDocuments(prev => prev.filter(d => d.doc_id !== docId))
    } catch (e) {
      setError('Failed to delete document.')
    }
  }, [])

  return { documents, loading, uploading, uploadProgress, error, uploadDocument, deleteDocument, refetch: fetchDocuments }
}
