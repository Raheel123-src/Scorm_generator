'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  Eye, 
  Plus, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  Settings,
  Trash2,
  GripVertical,
  ArrowLeft,
  BookOpen,
  Image,
  Video,
  CheckSquare,
  HelpCircle,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { ContentBlock, ContentType } from '@/types'

// Mock content blocks for demonstration
const mockContentBlocks: ContentBlock[] = [
  {
    id: '1',
    type: 'welcome',
    title: 'Welcome Page',
    data: {
      title: 'Welcome to the Course',
      description: 'This is an introduction to our comprehensive course.',
      duration: 5
    },
    order: 1
  },
  {
    id: '2',
    type: 'quiz',
    title: 'Knowledge Check',
    data: {
      questions: [
        {
          id: '1',
          type: 'mcq',
          question: 'What is React?',
          options: ['A library', 'A framework', 'A language', 'A database'],
          correctAnswer: 0
        }
      ]
    },
    order: 2
  }
]

const contentTypes: { type: ContentType; label: string; icon: any }[] = [
  { type: 'welcome', label: 'Welcome Page', icon: FileText },
  { type: 'accordion', label: 'Accordion', icon: ChevronDown },
  { type: 'checklist', label: 'Checklist', icon: CheckSquare },
  { type: 'text-image', label: 'Text & Image', icon: Image },
  { type: 'document', label: 'Document', icon: FileText },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'flashcards', label: 'Flashcards', icon: BookOpen },
  { type: 'quiz', label: 'Quiz', icon: HelpCircle },
  { type: 'hotspot', label: 'Hotspot Image', icon: Target },
]

export default function SCORMEditorPage({ params }: { params: { id: string } }) {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(mockContentBlocks)
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(contentBlocks[0])
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [scormTitle, setScormTitle] = useState('My SCORM Package')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAddContentBlock = (type: ContentType) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      title: contentTypes.find(ct => ct.type === type)?.label || 'New Block',
      data: {},
      order: contentBlocks.length + 1
    }
    setContentBlocks([...contentBlocks, newBlock])
    setSelectedBlock(newBlock)
    setShowAddMenu(false)
  }

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = contentBlocks.filter(block => block.id !== blockId)
    setContentBlocks(updatedBlocks)
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(updatedBlocks[0] || null)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      console.log('Saving SCORM:', { title: scormTitle, contentBlocks })
      // Implement save logic
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    console.log('Previewing SCORM')
    // Implement preview logic
  }

  const updateBlockData = (blockId: string, newData: any) => {
    setContentBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId 
          ? { ...block, data: { ...block.data, ...newData } }
          : block
      )
    )
  }

  const getBlockIcon = (type: string) => {
    const contentType = contentTypes.find(ct => ct.type === type)
    const IconComponent = contentType?.icon || FileText
    return <IconComponent size={16} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Top Navbar */}
      <div style={{
        background: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1rem 1.5rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/dashboard" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#6b7280',
              textDecoration: 'none',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'all 0.2s'
            }}>
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
            <div style={{ width: '1px', height: '2rem', background: '#e5e7eb' }} />
            <input
              type="text"
              value={scormTitle}
              onChange={(e) => setScormTitle(e.target.value)}
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                transition: 'all 0.2s',
                minWidth: '200px'
              }}
              onFocus={(e) => {
                e.target.style.background = '#f9fafb'
                e.target.style.border = '1px solid #d1d5db'
              }}
              onBlur={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.border = 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: loading ? '#9ca3af' : 'white',
                color: loading ? 'white' : '#374151',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handlePreview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* Left Sidebar - Content Blocks */}
        <div style={{
          width: '20rem',
          background: 'white',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: '#111827',
              margin: '0 0 1rem 0'
            }}>
              Content Blocks
            </h3>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={16} />
              Add Block
            </button>
          </div>

          {/* Add Content Type Menu */}
          {showAddMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}
            >
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151',
                margin: '0 0 0.75rem 0'
              }}>
                Choose Content Type
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {contentTypes.map((contentType) => (
                  <button
                    key={contentType.type}
                    onClick={() => handleAddContentBlock(contentType.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      fontSize: '0.75rem',
                      color: '#374151',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3e8ff'
                      e.currentTarget.style.borderColor = '#9333ea'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white'
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }}
                  >
                    <contentType.icon size={14} />
                    <span>{contentType.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Content Blocks List */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {contentBlocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: selectedBlock?.id === block.id ? '#f3e8ff' : 'white',
                    border: selectedBlock?.id === block.id ? '1px solid #9333ea' : '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedBlock(block)}
                >
                  <GripVertical size={16} style={{ color: '#9ca3af' }} />
                  {getBlockIcon(block.type)}
                  <span style={{ 
                    flex: 1, 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    color: selectedBlock?.id === block.id ? '#7c3aed' : '#374151'
                  }}>
                    {block.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteBlock(block.id)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      color: '#dc2626',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedBlock ? (
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              <motion.div
                key={selectedBlock.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ height: '100%' }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '600', 
                    color: '#111827',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {selectedBlock.title}
                  </h2>
                  <p style={{ 
                    color: '#6b7280', 
                    fontSize: '0.875rem',
                    margin: 0
                  }}>
                    Configure your {selectedBlock.title.toLowerCase()} content
                  </p>
                </div>

                {/* Content Type Editor */}
                <div style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  padding: '1.5rem',
                  height: '100%',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  {selectedBlock.type === 'welcome' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Title
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.data.title || ''}
                          onChange={(e) => updateBlockData(selectedBlock.id, { title: e.target.value })}
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
                          onFocus={(e) => {
                            e.target.style.borderColor = '#9333ea'
                            e.target.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db'
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Description
                        </label>
                        <textarea
                          rows={4}
                          value={selectedBlock.data.description || ''}
                          onChange={(e) => updateBlockData(selectedBlock.id, { description: e.target.value })}
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
                          onFocus={(e) => {
                            e.target.style.borderColor = '#9333ea'
                            e.target.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db'
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={selectedBlock.data.duration || ''}
                          onChange={(e) => updateBlockData(selectedBlock.id, { duration: parseInt(e.target.value) || 0 })}
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
                          onFocus={(e) => {
                            e.target.style.borderColor = '#9333ea'
                            e.target.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db'
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === 'quiz' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                          Quiz Questions
                        </h3>
                        <button style={{
                          background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          Add Question
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {selectedBlock.data.questions?.map((question: any, index: number) => (
                          <div key={question.id} style={{
                            padding: '1rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            background: '#f9fafb'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                                Question {index + 1}
                              </span>
                              <button style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <input
                              type="text"
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                outline: 'none',
                                marginBottom: '0.75rem',
                                boxSizing: 'border-box'
                              }}
                              placeholder="Enter question"
                              defaultValue={question.question}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {question.options?.map((option: string, optIndex: number) => (
                                <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    style={{ color: '#9333ea' }}
                                  />
                                  <input
                                    type="text"
                                    style={{
                                      flex: 1,
                                      padding: '0.75rem',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.875rem',
                                      outline: 'none',
                                      boxSizing: 'border-box'
                                    }}
                                    placeholder="Enter option"
                                    defaultValue={option}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Placeholder for other content types */}
                  {!['welcome', 'quiz'].includes(selectedBlock.type) && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '16rem', 
                      color: '#6b7280',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <FileText size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
                        <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem', color: '#111827' }}>
                          {selectedBlock.title} Editor
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Content editor for {selectedBlock.title.toLowerCase()} will be implemented here
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'white',
              margin: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <FileText size={64} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
                <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem', color: '#111827' }}>
                  No Content Block Selected
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  Select a content block from the sidebar to start editing
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Properties */}
        <div style={{
          width: '20rem',
          background: 'white',
          borderLeft: '1px solid #e5e7eb',
          padding: '1.5rem'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            color: '#111827',
            margin: '0 0 1rem 0'
          }}>
            Properties
          </h3>
          {selectedBlock && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Block Title
                </label>
                <input
                  type="text"
                  value={selectedBlock.title}
                  onChange={(e) => {
                    setSelectedBlock({
                      ...selectedBlock,
                      title: e.target.value
                    })
                  }}
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
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Block Type
                </label>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  background: '#f9fafb',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  {selectedBlock.type}
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Order
                </label>
                <input
                  type="number"
                  value={selectedBlock.order}
                  onChange={(e) => {
                    setSelectedBlock({
                      ...selectedBlock,
                      order: parseInt(e.target.value)
                    })
                  }}
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
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}