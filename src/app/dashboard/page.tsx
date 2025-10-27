'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
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

interface SCORMPackage {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  isPublished: boolean
  contentBlocks: number
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('my-scorms')
  const [scorms, setScorms] = useState<SCORMPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadSCORMs()
  }, [user, router])

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

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        bottom: 0, 
        zIndex: 50, 
        width: '16rem', 
        background: 'white', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '4rem', 
            padding: '0 1rem', 
            borderBottom: '1px solid #e5e7eb' 
          }}>
            <Link href="/" style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#9333ea',
              textDecoration: 'none'
            }}>
              LisaStudio
            </Link>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('my-scorms')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'my-scorms' ? '#f3e8ff' : 'transparent',
                color: activeTab === 'my-scorms' ? '#7c3aed' : '#374151'
              }}
            >
              <FileText size={20} style={{ marginRight: '0.75rem' }} />
              My Courses
            </button>
            
            <button
              onClick={() => setActiveTab('create-new')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'create-new' ? '#f3e8ff' : 'transparent',
                color: activeTab === 'create-new' ? '#7c3aed' : '#374151'
              }}
            >
              <Plus size={20} style={{ marginRight: '0.75rem' }} />
              Create New Course
            </button>
            
            <button
              onClick={() => setActiveTab('account')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'account' ? '#f3e8ff' : 'transparent',
                color: activeTab === 'account' ? '#7c3aed' : '#374151'
              }}
            >
              <User size={20} style={{ marginRight: '0.75rem' }} />
              Account
            </button>
          </nav>

          {/* User section */}
          <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '2rem', 
                height: '2rem', 
                background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <User size={16} style={{ color: 'white' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                style={{ 
                  color: '#9ca3af', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  transition: 'color 0.2s'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ paddingLeft: '16rem' }}>
        <div style={{ padding: '2rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ 
              fontSize: '1.875rem', 
              fontWeight: 'bold', 
              color: '#111827', 
              marginBottom: '0.5rem',
              margin: 0
            }}>
              {activeTab === 'my-scorms' && 'My Courses'}
              {activeTab === 'create-new' && 'Create New Course'}
              {activeTab === 'account' && 'Account Settings'}
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
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
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : error ? (
                <div style={{ 
                  padding: '2rem', 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  borderRadius: '0.5rem',
                  color: '#dc2626',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              ) : scorms.length === 0 ? (
                <div style={{ 
                  padding: '3rem', 
                  textAlign: 'center',
                  background: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <FileText size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                    No courses yet
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    Create your first course to get started
                  </p>
                  <Link href="/editor/new" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}>
                    <Plus size={20} />
                    Create First Course
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {scorms.map((scorm, index) => (
                    <motion.div
                      key={scorm.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      style={{
                        background: 'white',
                        borderRadius: '0.75rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e5e7eb',
                        padding: '1.5rem',
                        transition: 'box-shadow 0.3s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                            {scorm.title}
                          </h3>
                          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            {scorm.description || 'No description'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FileText size={12} />
                              {scorm.contentBlocks} blocks
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={12} />
                              {new Date(scorm.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button style={{ color: '#9ca3af', padding: '0.25rem' }}>
                          <MoreVertical size={16} />
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link
                          href={`/editor/${scorm.id}`}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                            color: 'white',
                            fontSize: '0.875rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            fontWeight: '500'
                          }}
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDeleteSCORM(scorm.id)}
                          style={{
                            background: 'white',
                            color: '#dc2626',
                            fontSize: '0.875rem',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #d1d5db',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
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
              style={{ maxWidth: '32rem' }}
            >
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                padding: '1.5rem'
              }}>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#111827', 
                  marginBottom: '1rem',
                  margin: 0
                }}>
                  Create New Course Package
                </h2>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label htmlFor="title" style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Course Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Enter course title"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                      placeholder="Enter course description"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button type="submit" style={{
                      background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                      color: 'white',
                      fontWeight: '500',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}>
                      Create Course
                    </button>
                    <button type="button" style={{
                      background: 'white',
                      color: '#374151',
                      fontWeight: '500',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}>
                      Cancel
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
              style={{ maxWidth: '32rem' }}
            >
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                padding: '1.5rem'
              }}>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#111827', 
                  marginBottom: '1rem',
                  margin: 0
                }}>
                  Account Settings
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Name
                    </label>
                    <input
                      type="text"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box'
                      }}
                      defaultValue={user?.name || 'User'}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box'
                      }}
                      defaultValue={user?.email || 'user@example.com'}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button style={{
                      background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                      color: 'white',
                      fontWeight: '500',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}>
                      Save Changes
                    </button>
                    <button style={{
                      background: 'white',
                      color: '#374151',
                      fontWeight: '500',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}>
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
          style={{ position: 'fixed', bottom: '2rem', right: '2rem' }}
        >
          <Link
            href="/editor/new"
            style={{
              background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '50%',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '500',
              transition: 'all 0.3s',
              minWidth: 'auto'
            }}
          >
            <Plus size={24} />
            <span style={{ fontSize: '0.875rem' }}>New Course</span>
          </Link>
        </motion.div>
      )}
    </div>
  )
}