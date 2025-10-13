'use client'

import { motion } from 'framer-motion'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  Eye, 
  Plus, 
  GripVertical, 
  Trash2, 
  ArrowLeft,
  Settings,
  FileText,
  Image,
  Video,
  BookOpen,
  CheckSquare,
  HelpCircle,
  Target,
  ChevronDown,
    Clock,
    Droplets
    } from 'lucide-react'
  import Link from 'next/link'
  import AlignmentDropdown from '@/components/AlignmentDropdown'
  import TextImageEditor from '@/components/Editor/TextImageEditor'
  import VideoEditor from '@/components/Editor/VideoEditor'
  import DocumentEditor from '@/components/Editor/DocumentEditor'
  import FlashcardEditor from '@/components/Editor/FlashcardEditor'
import HotspotImageEditor from '@/components/Editor/HotspotImageEditor'
import AccordionEditor from '@/components/Editor/AccordionEditor'
import ChecklistEditor from '@/components/Editor/ChecklistEditor'
import EmbedEditor from '@/components/Editor/EmbedEditor'
  import './editor.css'
  import './welcome-editor.css'
  import './hotspot-image-editor.css'
  import './accordion-editor.css'
  import './checklist-editor.css'
  import './embed-editor.css'

interface ContentBlock {
  id: string
  type: string
  title: string
  data: any
}

export default function EditorPage() {
  const [scormTitle, setScormTitle] = useState('My SCORM Package')
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    {
      id: '1',
      type: 'welcome',
      title: 'Welcome Page',
      data: {
        title: 'Welcome to the Course',
        description: 'This is an introduction to our comprehensive course.',
        duration: 5
      }
    },
    {
      id: '2',
      type: 'quiz',
      title: 'Knowledge Check',
      data: {
        title: 'Knowledge Check',
        questions: []
      }
    }
  ])
  const [activeBlock, setActiveBlock] = useState('1')
  const [loading, setLoading] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [hoveredType, setHoveredType] = useState<string | null>(null)
  const [showWelcomeSettings, setShowWelcomeSettings] = useState(false)
  const [welcomeSettings, setWelcomeSettings] = useState({
    title: true,
    description: true,
    timeEstimate: true,
    button: true
  })
  const [showAlignmentDropdown, setShowAlignmentDropdown] = useState(false)
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center')
  const alignmentButtonRef = useRef<HTMLButtonElement>(null)

  const addContentBlock = (type: string) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      title: getBlockTitle(type),
      data: getDefaultData(type)
    }
    setContentBlocks([...contentBlocks, newBlock])
    setActiveBlock(newBlock.id)
  }

  const getBlockTitle = (type: string) => {
    const titles: { [key: string]: string } = {
      welcome: 'Welcome Page',
      quiz: 'Quiz',
      text: 'Text & Image',
      video: 'Video',
      document: 'Document',
      flashcard: 'Flashcards',
      hotspot: 'Hotspot Image',
      accordion: 'Accordion',
      checklist: 'Checklist',
      embed: 'Embed'
    }
    return titles[type] || 'Content Block'
  }

  const getDefaultData = (type: string) => {
    const defaults: { [key: string]: any } = {
      welcome: { title: 'Welcome', description: '', duration: 5 },
      quiz: { title: 'Quiz', questions: [] },
      text: { title: 'Content', text: '', image: '' },
      video: { title: 'Video', url: '', description: '' },
      document: { title: 'Document', url: '', description: '' },
      flashcard: { title: 'Flashcards', cards: [] },
      hotspot: { title: 'Hotspot', image: '', hotspots: [] },
      accordion: { title: 'Accordion', items: [] },
      checklist: { title: 'Checklist', items: [] },
      embed: { title: 'Embed', url: '', description: '' }
    }
    return defaults[type] || {}
  }

  const updateBlockData = (blockId: string, newData: any) => {
    console.log('updateBlockData called:', { blockId, newData })
    setContentBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId 
          ? { ...block, data: { ...block.data, ...newData } }
          : block
      )
    )
  }

  // Custom hook for contentEditable elements
  const useContentEditable = (initialValue: string, onUpdate: (value: string) => void) => {
    const [isEditing, setIsEditing] = useState(false)
    const elementRef = useRef<HTMLDivElement>(null)
    const lastValueRef = useRef(initialValue)
    const isUpdatingRef = useRef(false)

    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
      if (isUpdatingRef.current) return
      
      const value = e.currentTarget.textContent || ''
      lastValueRef.current = value
      onUpdate(value)
    }, [onUpdate])

    const handleFocus = useCallback(() => {
      setIsEditing(true)
    }, [])

    const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
      setIsEditing(false)
      const value = e.currentTarget.textContent || ''
      lastValueRef.current = value
      onUpdate(value)
    }, [onUpdate])

    // Only update content when not editing and value has actually changed
    useEffect(() => {
      if (!isEditing && elementRef.current && initialValue !== lastValueRef.current) {
        isUpdatingRef.current = true
        const selection = window.getSelection()
        const range = selection?.getRangeAt(0)
        const cursorOffset = range?.startOffset || 0
        
        elementRef.current.textContent = initialValue
        lastValueRef.current = initialValue
        
        // Restore cursor position
        setTimeout(() => {
          if (elementRef.current && selection) {
            const textNode = elementRef.current.firstChild
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              const newRange = document.createRange()
              newRange.setStart(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0))
              newRange.collapse(true)
              selection.removeAllRanges()
              selection.addRange(newRange)
            }
          }
          isUpdatingRef.current = false
        }, 0)
      }
    }, [initialValue, isEditing])

    return {
      ref: elementRef,
      onInput: handleInput,
      onFocus: handleFocus,
      onBlur: handleBlur
    }
  }

  const deleteBlock = (blockId: string) => {
    setContentBlocks(prevBlocks => {
      const newBlocks = prevBlocks.filter(block => block.id !== blockId)
      if (activeBlock === blockId) {
        setActiveBlock(newBlocks[0]?.id || '')
      }
      return newBlocks
    })
  }

  const getBlockIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      welcome: FileText,
      quiz: HelpCircle,
      text: Image,
      video: Video,
      document: FileText,
      flashcard: BookOpen,
      hotspot: Target,
      accordion: Settings,
      checklist: CheckSquare
    }
    const IconComponent = icons[type] || FileText
    return <IconComponent size={16} />
  }

  const renderPreviewForType = (type: string) => {
    switch (type) {
      case 'welcome':
        return (
          <div className="welcome-preview" style={{ minHeight: '200px', maxHeight: '300px' }}>
            {/* Background Gradient Shape */}
            <div className="welcome-gradient" />
            
            {/* Main Content Area */}
            <div className="welcome-content">
              <div className="welcome-content-inner" data-alignment={textAlignment} style={{ textAlign: textAlignment }}>
                <div className="welcome-title">Welcome to the Course</div>
                {welcomeSettings.timeEstimate && (
                  <div className="welcome-duration" data-alignment={textAlignment} style={{ justifyContent: textAlignment === 'left' ? 'flex-start' : textAlignment === 'right' ? 'flex-end' : 'center' }}>
                    <Clock size={20} />
                    <span>5 minutes</span>
                  </div>
                )}
                {welcomeSettings.description && (
                  <div className="welcome-description" data-alignment={textAlignment} style={{ textAlign: textAlignment }}>This is an introduction to our comprehensive course.</div>
                )}
                {welcomeSettings.button && (
                  <button className="welcome-start-btn" data-alignment={textAlignment} style={{ 
                    marginLeft: textAlignment === 'left' ? '0' : textAlignment === 'right' ? 'auto' : 'auto',
                    marginRight: textAlignment === 'right' ? '0' : 'auto'
                  }}>Start Course</button>
                )}
              </div>
            </div>
          </div>
        )
      case 'quiz':
        return (
          <div style={{ 
            background: '#f8fafc', 
            borderRadius: '1rem', 
            padding: '2rem', 
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>
              <HelpCircle size={48} style={{ color: '#059669', marginBottom: '1rem' }} />
              <h3 style={{ color: '#111827', marginBottom: '0.5rem' }}>Quiz Preview</h3>
              <p style={{ color: '#6b7280' }}>Interactive questions and answers</p>
            </div>
          </div>
        )
      case 'video':
        return (
          <div style={{ 
            background: '#1f2937', 
            borderRadius: '1rem', 
            padding: '2rem', 
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>
              <Video size={48} style={{ color: '#7c3aed', marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Video Preview</h3>
              <p style={{ color: '#9ca3af' }}>Embedded video content</p>
            </div>
          </div>
        )
      case 'document':
        return (
          <div style={{ 
            background: '#fef3c7', 
            borderRadius: '1rem', 
            padding: '2rem', 
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>
              <FileText size={48} style={{ color: '#ea580c', marginBottom: '1rem' }} />
              <h3 style={{ color: '#111827', marginBottom: '0.5rem' }}>Document Preview</h3>
              <p style={{ color: '#6b7280' }}>PDF or document viewer</p>
            </div>
          </div>
        )
      case 'hotspot':
        return (
          <div style={{ 
            background: '#fce7f3', 
            borderRadius: '1rem', 
            padding: '2rem', 
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>
              <Target size={48} style={{ color: '#be185d', marginBottom: '1rem' }} />
              <h3 style={{ color: '#111827', marginBottom: '0.5rem' }}>Hotspot Preview</h3>
              <p style={{ color: '#6b7280' }}>Interactive image with clickable areas</p>
            </div>
          </div>
        )
      case 'accordion':
        return (
          <div style={{ 
            background: '#f0fdf4', 
            borderRadius: '1rem', 
            padding: '2rem', 
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>
              <ChevronDown size={48} style={{ color: '#65a30d', marginBottom: '1rem' }} />
              <h3 style={{ color: '#111827', marginBottom: '0.5rem' }}>Accordion Preview</h3>
              <p style={{ color: '#6b7280' }}>Expandable content sections</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Welcome Editor Component
  const WelcomeEditor = ({ block }: { block: any }) => {
    const titleEditable = useContentEditable(
      block.data.title || 'Welcome to the Course',
      (value) => updateBlockData(block.id, { title: value })
    )
    const descriptionEditable = useContentEditable(
      block.data.description || 'This is an introduction to our comprehensive course.',
      (value) => updateBlockData(block.id, { description: value })
    )

    return (
      <div className="welcome-preview">
            {/* Top Controls */}
            <div className="welcome-top-controls">
              <button 
                onClick={() => alert('Layout options coming soon!')}
                className="welcome-control-btn"
              >
                <Settings size={16} />
                Layout
              </button>
              <button 
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        updateBlockData(block.id, { backgroundImage: e.target?.result })
                      }
                      reader.readAsDataURL(file)
                    }
                  }
                  input.click()
                }}
                className="welcome-control-btn"
              >
                <Image size={16} />
                Add background image
              </button>
            </div>

            {/* Right Sidebar Icons */}
            <div className="welcome-sidebar-icons">
              <button 
                onClick={() => setShowWelcomeSettings(!showWelcomeSettings)}
                className="welcome-sidebar-icon"
              >
                <Eye size={20} />
              </button>
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setShowAlignmentDropdown(!showAlignmentDropdown)}
                    className="welcome-sidebar-icon"
                    title="Alignment Options"
                    style={{
                      background: showAlignmentDropdown ? 'rgba(255, 255, 255, 0.2)' : undefined
                    }}
                  >
                    <FileText size={20} />
                  </button>
                  
                  <AlignmentDropdown
                    currentAlignment={textAlignment}
                    onAlignmentChange={setTextAlignment}
                    isOpen={showAlignmentDropdown}
                    onClose={() => setShowAlignmentDropdown(false)}
                    triggerRef={alignmentButtonRef}
                  />
                </div>
              <button 
                onClick={() => alert('Settings panel coming soon!')}
                className="welcome-sidebar-icon"
              >
                <Settings size={20} />
              </button>
            </div>

            {/* Welcome Settings Panel */}
            {showWelcomeSettings && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="welcome-settings-panel"
              >
                <div className="welcome-settings-header">
                  <h4>Display Options</h4>
                  <button 
                    onClick={() => setShowWelcomeSettings(false)}
                    className="welcome-settings-close"
                  >
                    ×
                  </button>
                </div>
                  <div className="welcome-settings-content">
                    <div className="welcome-settings-item">
                      <span className="welcome-settings-label">
                        Title
                      </span>
                    <label className="welcome-settings-checkbox welcome-settings-disabled">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        readOnly
                      />
                      <span className="welcome-settings-checkmark"></span>
                    </label>
                  </div>
                  <div className="welcome-settings-item">
                    <span className={!welcomeSettings.description ? 'welcome-settings-label-disabled' : 'welcome-settings-label'}>
                      Description
                    </span>
                    <label className="welcome-settings-checkbox">
                      <input
                        type="checkbox"
                        checked={welcomeSettings.description}
                        onChange={(e) => setWelcomeSettings(prev => ({ ...prev, description: e.target.checked }))}
                      />
                      <span className="welcome-settings-checkmark"></span>
                    </label>
                  </div>
                  <div className="welcome-settings-item">
                    <span className={!welcomeSettings.timeEstimate ? 'welcome-settings-label-disabled' : 'welcome-settings-label'}>
                      Time estimate
                    </span>
                    <label className="welcome-settings-checkbox">
                      <input
                        type="checkbox"
                        checked={welcomeSettings.timeEstimate}
                        onChange={(e) => setWelcomeSettings(prev => ({ ...prev, timeEstimate: e.target.checked }))}
                      />
                      <span className="welcome-settings-checkmark"></span>
                    </label>
                  </div>
                  <div className="welcome-settings-item">
                    <span className={!welcomeSettings.button ? 'welcome-settings-label-disabled' : 'welcome-settings-label'}>
                      Button
                    </span>
                    <label className="welcome-settings-checkbox">
                      <input
                        type="checkbox"
                        checked={welcomeSettings.button}
                        onChange={(e) => setWelcomeSettings(prev => ({ ...prev, button: e.target.checked }))}
                      />
                      <span className="welcome-settings-checkmark"></span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Background Gradient Shape */}
            <div className="welcome-gradient" />

            {/* Main Content Area */}
            <div className="welcome-content">
              <div className="welcome-content-inner" data-alignment={textAlignment}>
                {/* Course Title - Editable */}
                 <div
                   contentEditable
                   suppressContentEditableWarning
                   className="welcome-title"
                   onInput={(e) => {
                     // Don't update state during typing to prevent re-rendering
                     console.log('Welcome Title Input (no state update):', e.currentTarget.textContent)
                   }}
                   onBlur={(e) => {
                     const value = e.currentTarget.textContent || ''
                     console.log('Welcome Title Blur (updating state):', { value })
                     updateBlockData(block.id, { title: value })
                   }}
                 >
                   {block.data.title || 'Welcome to the Course'}
                 </div>
                
                {/* Duration - Editable */}
                {welcomeSettings.timeEstimate ? (
                  <div className="welcome-duration" data-alignment={textAlignment}>
                    <Clock size={20} />
                    <input
                      type="number"
                      value={block.data.duration || 5}
                      onChange={(e) => updateBlockData(block.id, { duration: parseInt(e.target.value) || 0 })}
                      className="welcome-duration-input"
                    />
                    <span style={{ fontSize: '1rem' }}>minutes</span>
                  </div>
                ) : null}
                
                {/* Content Placeholder - Editable */}
                {welcomeSettings.description ? (
                   <div
                     contentEditable
                     suppressContentEditableWarning
                     className="welcome-description"
                     data-alignment={textAlignment}
                     onInput={(e) => {
                       // Don't update state during typing to prevent re-rendering
                       console.log('Welcome Description Input (no state update):', e.currentTarget.textContent)
                     }}
                     onBlur={(e) => {
                       const value = e.currentTarget.textContent || ''
                       console.log('Welcome Description Blur (updating state):', { value })
                       updateBlockData(block.id, { description: value })
                     }}
                   >
                     {block.data.description || 'This is an introduction to our comprehensive course.'}
                   </div>
                ) : null}
                
                {/* Start Course Button */}
                {welcomeSettings.button ? (
                  <button 
                    onClick={() => alert('Start Course functionality coming soon!')}
                    className="welcome-start-btn"
                    data-alignment={textAlignment}
                  >
                    Start Course
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )
      }

  const renderBlockEditor = () => {
    const block = contentBlocks.find(b => b.id === activeBlock)
    if (!block) return null

    switch (block.type) {
      case 'welcome':
        return <WelcomeEditor block={block} />
      
      case 'text-image':
        return (
          <TextImageEditor 
            data={block.data || { layout: 'right', image: '', content: '', title: 'Untitled', altText: '' }}
            onChange={(data) => updateBlockData(block.id, data)}
          />
        )
      
      case 'video':
        return (
          <VideoEditor
            data={block.data || { title: 'Untitled', videoUrl: '', enforceCompletion: false, description: '' }}
            onChange={(data) => updateBlockData(block.id, data)}
          />
        )
      
      case 'document':
        return (
          <DocumentEditor
            data={block.data || { title: 'Untitled', documentUrl: '', enforceCompletion: false, description: '' }}
            onChange={(data) => updateBlockData(block.id, data)}
          />
        )
      
        case 'flashcards':
          return (
            <FlashcardEditor
              data={block.data || { cards: [{ id: '1', front: 'Question 1', back: 'Add a description' }] }}
              onChange={(data) => updateBlockData(block.id, data)}
            />
          )
        case 'hotspot':
          return (
            <HotspotImageEditor
              data={block.data || { title: 'Untitled', imageUrl: '', altText: '', hotspots: [] }}
              onChange={(data) => updateBlockData(block.id, data)}
            />
          )
        case 'accordion':
          return (
            <AccordionEditor
              data={block.data || { title: 'Untitled', description: '', items: [] }}
              onChange={(data) => updateBlockData(block.id, data)}
            />
          )
        case 'checklist':
          return (
            <ChecklistEditor
              data={block.data || { title: 'Untitled', items: [] }}
              onChange={(data) => updateBlockData(block.id, data)}
            />
          )
        case 'embed':
          return (
            <EmbedEditor
              data={block.data || { title: 'Untitled', url: '', description: '' }}
              onChange={(data) => updateBlockData(block.id, data)}
            />
          )
      
      default:
        return (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: '#6b7280',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <Settings size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
            <p>Editor for {block.title} coming soon!</p>
          </div>
        )
    }
  }

  return (
    <div className="editor-container">
      {/* Header */}
      <div className="main-content-header">
        <div className="header-left">
          <Link href="/dashboard" className="back-button">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <div style={{ width: '1px', height: '2rem', background: '#e5e7eb' }} />
          <h1 className="editor-title">
            SCORM Editor
          </h1>
        </div>
        
        <div className="header-right">
          <input
            type="text"
            value={scormTitle}
            onChange={(e) => setScormTitle(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              background: '#f9fafb',
              minWidth: '200px'
            }}
          />
          <button
            onClick={() => setLoading(true)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
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
            onClick={() => setPreviewMode(!previewMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: previewMode ? 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' : 'white',
              color: previewMode ? 'white' : '#374151',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <Eye size={16} />
            {previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

        <div className="main-content">
          {/* Left Sidebar */}
          <div className="sidebar">
          {/* Content Blocks Header */}
          <div className="sidebar-header">
            <h2 className="sidebar-title">
              Content Blocks
            </h2>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="add-block-btn"
            >
              <Plus size={16} />
              Add screen
            </button>
          </div>

          {/* Add Content Type Menu */}
          {showAddMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                padding: '1.5rem', 
                borderBottom: '1px solid #e5e7eb', 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
              }}
            >
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#111827',
                margin: '0 0 1rem 0'
              }}>
                Choose Content Type
              </h4>
              <div className="block-type-grid">
                {[
                  { type: 'welcome', label: 'Welcome Page', icon: FileText, color: '#9333ea' },
                  { type: 'quiz', label: 'Quiz', icon: HelpCircle, color: '#059669' },
                  { type: 'text-image', label: 'Text & Image', icon: Image, color: '#dc2626' },
                  { type: 'video', label: 'Video', icon: Video, color: '#7c3aed' },
                  { type: 'document', label: 'Document', icon: FileText, color: '#ea580c' },
                  { type: 'flashcards', label: 'Flashcards', icon: BookOpen, color: '#0891b2' },
                  { type: 'hotspot', label: 'Hotspot Image', icon: Target, color: '#be185d' },
                  { type: 'accordion', label: 'Accordion', icon: ChevronDown, color: '#65a30d' },
                  { type: 'checklist', label: 'Checklist', icon: CheckSquare, color: '#ca8a04' },
                  { type: 'embed', label: 'Embed', icon: Plus, color: '#059669' }
                ].map((contentType) => (
                  <button
                    key={contentType.type}
                    onClick={() => {
                      addContentBlock(contentType.type)
                      setShowAddMenu(false)
                    }}
                    onMouseEnter={() => setHoveredType(contentType.type)}
                    onMouseLeave={() => setHoveredType(null)}
                    className="block-type-item"
                  >
                    <div 
                      className="block-type-icon"
                      style={{ background: `linear-gradient(135deg, ${contentType.color} 0%, ${contentType.color}dd 100%)` }}
                    >
                      <contentType.icon size={18} />
                    </div>
                    <span className="block-type-label">
                      {contentType.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Content Blocks List */}
          <div className="sidebar-content">
            <div className="content-blocks">
              {contentBlocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`content-block-preview ${activeBlock === block.id ? 'active' : ''}`}
                  data-type={block.type}
                  onClick={() => {
                    setActiveBlock(block.id)
                    setPreviewMode(false)
                    setHoveredType(null)
                  }}
                >
                  <div className="content-block-number">
                    {index + 1}
                  </div>
                  <div className="mini-preview-container">
                    {block.type === 'welcome' && (
                        <div className="mini-preview">
                          <div className="mini-preview-content">
                            <div className="mini-preview-title">{block.data.title || 'Welcome to the Course'}</div>
                            <div className="mini-preview-duration">{block.data.duration || 5} minutes</div>
                            <div className="mini-preview-description">{block.data.description || 'This is an introduction...'}</div>
                            <div className="mini-preview-button">Start Course</div>
                          </div>
                        </div>
                      )}
                      {block.type === 'quiz' && (
                        <div className="mini-preview">
                          <div className="mini-preview-content">
                            <div className="mini-preview-icon">❓</div>
                            <div className="mini-preview-title">Test your knowledge</div>
                            <div className="mini-preview-description">Interactive questions</div>
                          </div>
                        </div>
                      )}
                    {block.type === 'text-image' && (
                      <div className="mini-preview">
                        <div 
                          className={`mini-preview-content layout-${block.data.layout || 'right'}`}
                          style={block.data.layout === 'behind' && block.data.image ? {
                            backgroundImage: `url(${block.data.image})`
                          } : {}}
                        >
                          <div className="mini-preview-text-section">
                            <div className="mini-preview-title">{block.data.title || 'Untitled'}</div>
                            <div className="mini-preview-description">
                              {block.data.content ? 
                                (block.data.content.length > 50 ? 
                                  block.data.content.substring(0, 50) + '...' : 
                                  block.data.content
                                ) : 
                                'Rich content with images'
                              }
                            </div>
                          </div>
                          {block.data.image && block.data.layout !== 'none' && block.data.layout !== 'behind' && (
                            <div className="mini-preview-image-section">
                              <img src={block.data.image} alt="Preview" style={{ width: '100%', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {block.type === 'video' && (
                      <div className="mini-preview">
                        <div className="mini-preview-content">
                          <div className="mini-preview-icon">🎥</div>
                          <div className="mini-preview-title">Video Content</div>
                          <div className="mini-preview-description">Embedded video player</div>
                        </div>
                      </div>
                    )}
                    {block.type === 'document' && (
                      <div className="mini-preview">
                        <div className="mini-preview-content">
                          <div className="mini-preview-icon">📄</div>
                          <div className="mini-preview-title">Document Viewer</div>
                          <div className="mini-preview-description">PDF or document display</div>
                        </div>
                      </div>
                    )}
                    {block.type === 'flashcards' && (
                      <div className="mini-preview">
                        <div className="mini-preview-content">
                          <div className="mini-preview-icon">🃏</div>
                          <div className="mini-preview-title">Flashcards</div>
                          <div className="mini-preview-description">Interactive learning cards</div>
                        </div>
                      </div>
                    )}
                    {block.type === 'hotspot' && (
                      <div className="mini-preview">
                        <div className="mini-preview-content">
                          <div className="mini-preview-block-title">{block.title}</div>
                          <div className="mini-preview-icon">🎯</div>
                          <div className="mini-preview-title">Hotspot Image</div>
                          <div className="mini-preview-description">Clickable image areas</div>
                        </div>
                      </div>
                    )}
                    {block.type === 'accordion' && (
                      <div className="mini-preview">
                        <div className="mini-preview-content">
                          <div className="mini-preview-title">{block.data.title || 'Untitled'}</div>
                          <div className="mini-preview-description">
                            {block.data.description ? 
                              (block.data.description.length > 50 ? 
                                block.data.description.substring(0, 50) + '...' : 
                                block.data.description
                              ) : 
                              'Expandable sections'
                            }
                          </div>
                          {block.data.items && block.data.items.length > 0 && (
                            <div className="mini-preview-accordion-items">
                              {block.data.items.slice(0, 3).map((item: any, index: number) => (
                                <div key={index} className="mini-preview-accordion-item">
                                  <div className="mini-preview-accordion-icon">+</div>
                                  <div className="mini-preview-accordion-text">{item.title || `Item ${index + 1}`}</div>
                                </div>
                              ))}
                              {block.data.items.length > 3 && (
                                <div className="mini-preview-accordion-more">+{block.data.items.length - 3} more</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {block.type === 'checklist' && (
                      <div className="mini-preview">
                        <div className="mini-preview-content">
                          <div className="mini-preview-block-title">{block.title}</div>
                          <div className="mini-preview-icon">✅</div>
                          <div className="mini-preview-title">Checklist</div>
                          <div className="mini-preview-description">Interactive checklist items</div>
                        </div>
                      </div>
                    )}
                    {block.type === 'embed' && (
                      <div className="mini-preview">
                        <div className="mini-preview-content">
                          <div className="mini-preview-title">{block.data.title || 'Untitled'}</div>
                          <div className="mini-preview-description">
                            {block.data.description ? 
                              (block.data.description.length > 50 ? 
                                block.data.description.substring(0, 50) + '...' : 
                                block.data.description
                              ) : 
                              (block.data.url ? 
                                (block.data.url.length > 30 ? 
                                  block.data.url.substring(0, 30) + '...' : 
                                  block.data.url
                                ) : 
                                'External website embed'
                              )
                            }
                          </div>
                          {block.data.url && (
                            <div className="mini-preview-iframe-container">
                              <iframe
                                src={block.data.url}
                                className="mini-preview-iframe"
                                title="Embedded Content Preview"
                                allowFullScreen
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteBlock(block.id)
                    }}
                    className="delete-btn"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="editor-area">
          {hoveredType ? (
            <div style={{ 
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start'
            }}>
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                zIndex: 10
              }}>
                Preview: {hoveredType.charAt(0).toUpperCase() + hoveredType.slice(1)}
              </div>
              {renderPreviewForType(hoveredType)}
            </div>
          ) : previewMode ? (
            <div style={{
              width: '100%',
              height: '100%',
              background: (() => {
                const welcomeBlock = contentBlocks.find(b => b.type === 'welcome')
                if (!welcomeBlock) return 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
                
                if (welcomeBlock.data.backgroundType === 'color') {
                  return welcomeBlock.data.backgroundColor || '#1a1a2e'
                } else if (welcomeBlock.data.backgroundType === 'image') {
                  return `url(${welcomeBlock.data.backgroundImage}) center/cover`
                } else if (welcomeBlock.data.backgroundType === 'gradient') {
                  const type = welcomeBlock.data.gradientType || 'linear'
                  const color1 = welcomeBlock.data.gradientColor1 || '#1a1a2e'
                  const color2 = welcomeBlock.data.gradientColor2 || '#16213e'
                  return `${type}-gradient(135deg, ${color1} 0%, ${color2} 100%)`
                }
                return 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
              })(),
              borderRadius: '1rem',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Background gradient shape */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '60%',
                height: '200%',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%)',
                borderRadius: '50%',
                opacity: 0.3,
                transform: 'rotate(-15deg)'
              }} />
              
              {/* Content */}
              <div style={{
                textAlign: 'center',
                color: 'white',
                zIndex: 10,
                position: 'relative',
                maxWidth: '600px',
                padding: '2rem'
              }}>
                <div 
                  style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textAlign: 'center'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: contentBlocks.find(b => b.type === 'welcome')?.data?.content || 
                    '<h1>Welcome to the Course</h1><p>This is an introduction to our comprehensive course.</p>' 
                  }}
                />
                
                {welcomeSettings.timeEstimate && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '2rem',
                    color: '#cbd5e1'
                  }}>
                    <Clock size={20} />
                    <span style={{ fontSize: '1rem' }}>
                      {contentBlocks.find(b => b.type === 'welcome')?.data?.duration || 0} minutes
                    </span>
                  </div>
                )}
                
                {welcomeSettings.button && (
                  <button style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '2rem',
                    border: 'none',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(59, 130, 246, 0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
                  }}
                  >
                    Start Course
                  </button>
                )}
              </div>
              
              {/* Top controls */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 20
              }}>
                <button style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#1f2937',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  <Settings size={16} style={{ color: '#1f2937' }} />
                  Layout
                </button>
                <button style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#1f2937',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  <Image size={16} style={{ color: '#1f2937' }} />
                  Add background image
                </button>
              </div>
              
              {/* Right sidebar icons */}
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '1rem',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                zIndex: 20
              }}>
                <button 
                  onClick={() => setShowWelcomeSettings(!showWelcomeSettings)}
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Display Options"
                >
                  <Eye size={20} />
                </button>
                <div style={{ position: 'relative' }}>
                  <button 
                    ref={alignmentButtonRef}
                    onClick={() => setShowAlignmentDropdown(!showAlignmentDropdown)}
                    style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      background: showAlignmentDropdown ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Alignment Options"
                  >
                    <FileText size={20} />
                  </button>
                  
                  <AlignmentDropdown
                    currentAlignment={textAlignment}
                    onAlignmentChange={setTextAlignment}
                    isOpen={showAlignmentDropdown}
                    onClose={() => setShowAlignmentDropdown(false)}
                    triggerRef={alignmentButtonRef}
                  />
                </div>
                <button 
                  onClick={() => alert('Settings panel coming soon!')}
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Settings Panel"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>
          ) : activeBlock && contentBlocks.find(b => b.id === activeBlock) ? (
            <motion.div
              key={activeBlock}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderBlockEditor()}
            </motion.div>
          ) : (
            <div className="empty-state">
              <FileText size={48} className="empty-icon" />
              <h3 className="empty-title">
                No content blocks yet
              </h3>
              <p className="empty-description">
                Add your first content block to get started
              </p>
              <button
                onClick={() => setShowAddMenu(true)}
                className="start-building-btn"
              >
                <Plus size={16} />
                Start Building
              </button>
            </div>
          )}
          
          {/* Right Sidebar - Only for text-image blocks */}
          {activeBlock && contentBlocks.find(b => b.id === activeBlock)?.type === 'text-image' && (
            <div className="right-sidebar">
              <div className="sidebar-content">
                <div className="visibility-card">
                  <div className="visibility-header">
                    <h4>Display Options</h4>
                  </div>
                  
                  <div className="visibility-options">
                    <div className="visibility-option">
                      <span className="visibility-text">Title</span>
                      <label className="visibility-checkbox">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => {}}
                        />
                        <span className="visibility-checkmark"></span>
                      </label>
                    </div>
                    <div className="visibility-option">
                      <span className="visibility-text">Description</span>
                      <label className="visibility-checkbox">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => {}}
                        />
                        <span className="visibility-checkmark"></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="sidebar-icons">
                    <button className="sidebar-icon" title="Preview">
                      <Eye size={20} />
                    </button>
                    <button className="sidebar-icon" title="Color">
                      <Droplets size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
