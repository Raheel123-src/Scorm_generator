'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Plus, 
  Eye,
  Droplets,
  Trash2
} from 'lucide-react'

interface EmbedData {
  title: string;
  url: string;
  description?: string;
}

interface EmbedEditorProps {
  data: EmbedData
  onChange: (data: EmbedData) => void
}

export default function EmbedEditor({ data, onChange }: EmbedEditorProps) {
  const [formData, setFormData] = useState<EmbedData>({
    title: data.title || 'Untitled',
    url: data.url || '',
    description: data.description || ''
  })
  
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(true)
  const [hasAddedContent, setHasAddedContent] = useState(false)
  const [visibilityOptions, setVisibilityOptions] = useState({
    title: true,
    description: true
  })

  const visibilityRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  // Check if content is already added on mount
  useEffect(() => {
    if (formData.url.trim()) {
      setHasAddedContent(true)
    }
  }, [])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      if (visibilityRef.current && !visibilityRef.current.contains(target)) {
        setShowVisibilityDropdown(true)
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(true)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showVisibilityDropdown])

  const handleTitleChange = (e: React.FocusEvent<HTMLHeadingElement>) => {
    const updatedData = { ...formData, title: e.currentTarget.textContent || '' }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedData = { ...formData, url: e.target.value }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleAddContent = () => {
    if (formData.url.trim()) {
      setHasAddedContent(true)
      onChange(formData)
    }
  }

  const handleDescriptionChange = (e: React.FocusEvent<HTMLDivElement>) => {
    const updatedData = { ...formData, description: e.currentTarget.textContent || '' }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleDeleteEmbed = () => {
    const updatedData = { ...formData, url: '' }
    setFormData(updatedData)
    setHasAddedContent(false)
    onChange(updatedData)
  }

  return (
    <div className="embed-editor">
      {/* Main Content */}
      <div className="embed-content">
        <div className="embed-main">
          {/* Delete Embed Button - Show at top when content is embedded */}
          {hasAddedContent && formData.url && (
            <button 
              className="delete-embed-btn"
              onClick={handleDeleteEmbed}
            >
              <Trash2 size={16} />
              <span>Delete embed</span>
            </button>
          )}

          <h1 
            className="embed-title"
            contentEditable
            suppressContentEditableWarning
            onBlur={handleTitleChange}
            style={{ display: visibilityOptions.title ? 'block' : 'none' }}
          >
            {formData.title}
          </h1>
          
          <div 
            className="embed-description"
            contentEditable
            suppressContentEditableWarning
            onBlur={handleDescriptionChange}
            style={{ display: visibilityOptions.description ? 'block' : 'none' }}
          >
            {formData.description || 'Add a description...'}
          </div>

          {/* URL Input Section - Only show if content not added */}
          {!hasAddedContent && (
            <div className="embed-input-section">
              <input
                type="url"
                className="embed-url-input"
                placeholder="Paste a URL here"
                value={formData.url}
                onChange={handleUrlChange}
              />
              
              <button 
                className="add-content-btn"
                onClick={handleAddContent}
                disabled={!formData.url.trim()}
              >
                <div className="add-content-icon">
                  <Plus size={16} />
                </div>
                <span>Add content</span>
              </button>
            </div>
          )}


          {/* Embedded Content - Only show if content has been added */}
          {hasAddedContent && formData.url && (
            <div className="embed-content-section">
              <div className="embed-iframe-container">
                <iframe
                  src={formData.url}
                  className="embed-iframe"
                  title="Embedded Content"
                  allowFullScreen
                />
              </div>
              
              <button 
                className="edit-url-btn"
                onClick={() => setHasAddedContent(false)}
              >
                Edit URL
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="embed-sidebar">
          <button 
            className="sidebar-icon"
            onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
          >
            <Eye size={16} />
          </button>
          <button 
            className="sidebar-icon"
            onClick={() => setShowColorPicker(!showColorPicker)}
          >
            <Droplets size={16} />
          </button>
        </div>

        {/* Visibility Dropdown */}
        {showVisibilityDropdown && (
          <div className="visibility-dropdown" ref={visibilityRef}>
            <div className="visibility-option">
              <span className="option-label">Title</span>
              <label className="embed-visibility-checkbox">
                <input 
                  type="checkbox" 
                  checked={visibilityOptions.title}
                  onChange={(e) => setVisibilityOptions(prev => ({ ...prev, title: e.target.checked }))}
                />
                <span className="embed-visibility-checkmark"></span>
              </label>
            </div>
            <div className="visibility-option">
              <span className="option-label">Description</span>
              <label className="embed-visibility-checkbox">
                <input 
                  type="checkbox" 
                  checked={visibilityOptions.description}
                  onChange={(e) => setVisibilityOptions(prev => ({ ...prev, description: e.target.checked }))}
                />
                <span className="embed-visibility-checkmark"></span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
