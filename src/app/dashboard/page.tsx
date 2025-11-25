'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  FileText, 
  Edit, 
  Trash2, 
  MoreVertical, 
  User, 
  Settings,
  LogOut,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { scormAPI } from '@/lib/api'
import './dashboard.css'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  'https://scrom.lisaapp.in/api'

interface SCORMPackage {
  id: string
  title: string
  description: string
  userId: string
  content: any[] // Full content array exactly as stored (from frontend format)
  createdAt: string
  updatedAt: string
  isPublished: boolean
  contentBlocks?: number // Optional for backwards compatibility
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('my-scorms')
  const [scorms, setScorms] = useState<SCORMPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, logout, loading: authLoading } = useAuth()
  const router = useRouter()
  
  // Document upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [courseTitle, setCourseTitle] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    loadSCORMs()
  }, [user, authLoading, router])

  const loadSCORMs = async () => {
    try {
      setLoading(true)
      const response = await scormAPI.getSCORMs()
      setScorms(response.packages)
    } catch (error: any) {
      setError('Failed to load SCORM packages')
      console.error('Error loading SCORMs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSCORM = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SCORM package?')) return
    
    try {
      await scormAPI.deleteSCORM(id)
      setScorms(scorms.filter(scorm => scorm.id !== id))
    } catch (error: any) {
      setError('Failed to delete SCORM package')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!validTypes.includes(file.type)) {
        setUploadError('Please select a PDF or DOC/DOCX file')
        return
      }
      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setUploadError('File size must be less than 50MB')
        return
      }
      setSelectedFile(file)
      setUploadError('')
    }
  }

  const handleGenerateFromDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setUploadError('Please select a document file')
      return
    }

    if (!courseTitle || courseTitle.trim() === '') {
      setUploadError('Please enter a course title')
      return
    }

    try {
      setUploading(true)
      setUploadError('')

      const token = localStorage.getItem('authToken')
      if (!token) {
        setUploadError('Please log in to generate SCORM')
        return
      }

      const formData = new FormData()
      formData.append('document', selectedFile)
      formData.append('title', courseTitle.trim())

      const response = await fetch(`${API_BASE_URL}/scorm/generate-from-doc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate SCORM' }))
        throw new Error(errorData.message || 'Failed to generate SCORM from document')
      }

      const scormData = await response.json()
      console.log('Generated SCORM data:', scormData)

      // Create SCORM package in database
      const createResponse = await fetch(`${API_BASE_URL}/scorm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: scormData.title,
          description: scormData.description || 'Generated from uploaded document',
          content: scormData.content
        })
      })

      if (!createResponse.ok) {
        throw new Error('Failed to save SCORM package')
      }

      const createdScorm = await createResponse.json()
      console.log('SCORM package created:', createdScorm)

      // Redirect to editor with the generated SCORM
      router.push(`/editor/new?id=${createdScorm.id}`)
      
    } catch (error: any) {
      console.error('Error generating SCORM from document:', error)
      setUploadError(error.message || 'Failed to generate SCORM from document')
    } finally {
      setUploading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="dashboard-loading-container">
        <Loader2 size={32} className="dashboard-loading-spinner" />
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="dashboard-sidebar-inner">
          {/* Logo */}
          <div className="dashboard-logo-container">
            <Link href="/" className="dashboard-logo-link">
              <Image
                src="/images/dashboard/image.png"
                alt="LisaStudio logo"
                width={160}
                height={40}
                className="dashboard-logo-image"
                priority
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="dashboard-nav">
            <button
              onClick={() => setActiveTab('my-scorms')}
              className={`dashboard-nav-button ${activeTab === 'my-scorms' ? 'active' : ''}`}
            >
              <FileText size={20} className="dashboard-nav-button-icon" />
              My Courses
            </button>
            
            <button
              onClick={() => setActiveTab('create-new')}
              className={`dashboard-nav-button ${activeTab === 'create-new' ? 'active' : ''}`}
            >
              <Plus size={20} className="dashboard-nav-button-icon" />
              Change Doc to Scorm
            </button>
            
            <button
              onClick={() => setActiveTab('account')}
              className={`dashboard-nav-button ${activeTab === 'account' ? 'active' : ''}`}
            >
              <User size={20} className="dashboard-nav-button-icon" />
              Account
            </button>
          </nav>

          {/* User section */}
          <div className="dashboard-user-section">
            <div className="dashboard-user-container">
              <div className="dashboard-user-avatar">
                <User size={16} className="dashboard-user-avatar-icon" />
              </div>
              <div className="dashboard-user-info">
                <p className="dashboard-user-name">
                  {user?.name || 'User'}
                </p>
                <p className="dashboard-user-email">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="dashboard-logout-button"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="dashboard-main-content">
        <div className="dashboard-content-inner">
          {/* Header */}
          <div className="dashboard-header">
            <h1 className="dashboard-title">
              {activeTab === 'my-scorms' && 'My Courses'}
              {activeTab === 'create-new' && 'Change Doc to Scorm'}
              {activeTab === 'account' && 'Account Settings'}
            </h1>
            <p className="dashboard-subtitle">
              {activeTab === 'my-scorms' && 'Manage and edit your courses'}
              {activeTab === 'create-new' && 'Start building your new course'}
              {activeTab === 'account' && 'Manage your account settings and preferences'}
            </p>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'my-scorms' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {loading ? (
                <div className="dashboard-loading-center">
                  <Loader2 size={32} className="dashboard-loading-spinner" />
                </div>
              ) : error ? (
                <div className="dashboard-error">
                  {error}
                </div>
              ) : scorms.length === 0 ? (
                <div className="dashboard-empty-state">
                  <FileText size={48} className="dashboard-empty-icon" />
                  <h3 className="dashboard-empty-title">
                    No courses yet
                  </h3>
                  <p className="dashboard-empty-description">
                    Create your first course to get started
                  </p>
                  <Link href="/editor/new" className="dashboard-primary-button">
                    <Plus size={20} />
                    Create First Course
                  </Link>
                </div>
              ) : (
                <div className="dashboard-scorms-grid">
                  {scorms.map((scorm, index) => (
                    <motion.div
                      key={scorm.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="dashboard-scorm-card"
                    >
                      <div className="dashboard-scorm-card-header">
                        <div className="dashboard-scorm-card-content">
                          <h3 className="dashboard-scorm-card-title">
                            {scorm.title}
                          </h3>
                          <p className="dashboard-scorm-card-description">
                            {scorm.description || 'No description'}
                          </p>
                          <div className="dashboard-scorm-card-meta">
                            <span className="dashboard-scorm-card-meta-item">
                              <FileText size={12} />
                              {scorm.contentBlocks} blocks
                            </span>
                            <span className="dashboard-scorm-card-meta-item">
                              <Calendar size={12} />
                              {new Date(scorm.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button className="dashboard-scorm-card-menu-button">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                      
                      <div className="dashboard-scorm-card-actions">
                        <Link
                          href={`/editor/new?id=${scorm.id}`}
                          className="dashboard-edit-button"
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDeleteSCORM(scorm.id)}
                          className="dashboard-delete-button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'create-new' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="dashboard-max-width"
            >
              <div className="dashboard-form-container">
                <h2 className="dashboard-form-title">
                  Change Doc to Scorm
                </h2>
                <form className="dashboard-form" onSubmit={handleGenerateFromDoc}>
                  <div className="dashboard-form-group">
                    <label htmlFor="course-title" className="dashboard-form-label">
                      Course Title
                    </label>
                    <input
                      type="text"
                      id="course-title"
                      className="dashboard-form-input"
                      placeholder="Enter course title"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      disabled={uploading}
                    />
                  </div>
                  <div className="dashboard-form-group">
                    <label htmlFor="document" className="dashboard-form-label">
                      Upload Document (PDF/DOC/DOCX)
                    </label>
                    <input
                      type="file"
                      id="document"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="dashboard-form-input"
                      onChange={handleFileChange}
                      disabled={uploading}
                      style={{ padding: '0.5rem' }}
                    />
                    {selectedFile && (
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  {uploadError && (
                    <div className="dashboard-error" style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {uploadError}
                    </div>
                  )}
                  <div className="dashboard-form-actions">
                    <button 
                      type="submit" 
                      className="dashboard-primary-button"
                      disabled={uploading || !selectedFile || !courseTitle.trim()}
                      style={{ opacity: (uploading || !selectedFile || !courseTitle.trim()) ? 0.6 : 1, cursor: (uploading || !selectedFile || !courseTitle.trim()) ? 'not-allowed' : 'pointer' }}
                    >
                      {uploading ? 'Generating...' : 'Generate SCORM'}
                    </button>
                    <button 
                      type="button" 
                      className="dashboard-secondary-button"
                      onClick={() => {
                        setSelectedFile(null)
                        setCourseTitle('')
                        setUploadError('')
                      }}
                      disabled={uploading}
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="dashboard-max-width"
            >
              <div className="dashboard-form-container">
                <h2 className="dashboard-form-title">
                  Account Settings
                </h2>
                <div className="dashboard-form">
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">
                      Name
                    </label>
                    <input
                      type="text"
                      className="dashboard-form-input"
                      defaultValue={user?.name || 'User'}
                    />
                  </div>
                  <div className="dashboard-form-group">
                    <label className="dashboard-form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      className="dashboard-form-input"
                      defaultValue={user?.email || 'user@example.com'}
                    />
                  </div>
                  <div className="dashboard-form-actions">
                    <button className="dashboard-primary-button">
                      Save Changes
                    </button>
                    <button className="dashboard-secondary-button">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      {activeTab === 'my-scorms' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="dashboard-fab"
        >
          <Link
            href="/editor/new"
            className="dashboard-fab-link"
          >
            <Plus size={24} />
          </Link>
        </motion.div>
      )}
    </div>
  )
}