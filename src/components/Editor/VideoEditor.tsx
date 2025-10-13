'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Eye, 
  Droplets,
  CheckSquare,
  RotateCcw,
  Heart,
  Clock,
  Send
} from 'lucide-react'
import { VideoData } from '@/types'
import '../../app/editor/new/video-editor.css'

interface VideoEditorProps {
  data: VideoData
  onChange: (data: VideoData) => void
}

export default function VideoEditor({ data, onChange }: VideoEditorProps) {
  const [formData, setFormData] = useState<VideoData>({
    title: data.title || 'Untitled',
    videoUrl: data.videoUrl || '',
    enforceCompletion: data.enforceCompletion || false,
    description: data.description || ''
  })
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [visibilityOptions, setVisibilityOptions] = useState({
    title: true,
    description: true
  })
  const visibilityRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const handleChange = (field: keyof VideoData, value: string | boolean) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChange(newData)
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      handleChange('videoUrl', url)
    }
  }

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (visibilityRef.current && !visibilityRef.current.contains(event.target as Node)) {
        setShowVisibilityDropdown(false)
      }
      if (colorPickerRef.current && !colorPickerRef.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
    }

    if (showVisibilityDropdown || showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showVisibilityDropdown, showColorPicker])

  return (
    <div className="video-editor">
      {/* Top Section */}
      <div className="video-editor-header">
        <div className="video-controls">
          <button className="enforce-completion-btn">
            <CheckSquare size={16} />
            Enforce completion
          </button>
          <button className="replace-video-btn" onClick={() => document.getElementById('video-upload')?.click()}>
            <RotateCcw size={16} />
            Replace video
          </button>
        </div>
      </div>

      {/* Hidden video upload input - always available */}
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        style={{ display: 'none' }}
      />

      {/* Video Player Section */}
      <div className="video-player-container">
        {/* Video Title */}
        {visibilityOptions.title && (
          <div className="video-title-section">
            <h1 
              contentEditable
              suppressContentEditableWarning
              className="video-title"
              onBlur={(e) => handleChange('title', e.currentTarget.textContent || '')}
            >
              {formData.title}
            </h1>
          </div>
        )}
        
        {/* Video Description */}
        {visibilityOptions.description && (
          <div className="video-description-section">
            <div 
              contentEditable
              suppressContentEditableWarning
              className="video-description"
              onBlur={(e) => handleChange('description', e.currentTarget.textContent || '')}
            >
              {formData.description || 'Add a description for your video...'}
            </div>
          </div>
        )}
        
        <div className="video-player-wrapper">
          <div className="video-player">
            {formData.videoUrl ? (
              <video 
                src={formData.videoUrl}
                controls
                className="video-element"
              />
            ) : (
              <div className="video-placeholder">
                <div className="video-upload-area">
                  <div className="upload-content">
                    <div className="upload-icon">🎥</div>
                    <h3>Upload Video</h3>
                    <p>Click to select a video file or drag and drop</p>
                    <button 
                      className="upload-btn"
                      onClick={() => document.getElementById('video-upload')?.click()}
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Side Icons */}
            <div className="video-side-icons">
              <button className="side-icon" title="Like">
                <Heart size={20} />
              </button>
              <button className="side-icon" title="Watch Later">
                <Clock size={20} />
              </button>
              <button className="side-icon" title="Share">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="video-sidebar">
        <div className="sidebar-icon-container">
          <button 
            className="sidebar-icon"
            onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
            title="Visibility"
          >
            <Eye size={20} />
          </button>
          
          {showVisibilityDropdown && (
            <div className="visibility-dropdown" ref={visibilityRef}>
              <div className="visibility-option">
                <span className="visibility-text">Title</span>
                <label className="visibility-checkbox">
                  <input
                    type="checkbox"
                    checked={visibilityOptions.title}
                    onChange={(e) => setVisibilityOptions(prev => ({ ...prev, title: e.target.checked }))}
                  />
                  <span className="visibility-checkmark"></span>
                </label>
              </div>
              <div className="visibility-option">
                <span className="visibility-text">Description</span>
                <label className="visibility-checkbox">
                  <input
                    type="checkbox"
                    checked={visibilityOptions.description}
                    onChange={(e) => setVisibilityOptions(prev => ({ ...prev, description: e.target.checked }))}
                  />
                  <span className="visibility-checkmark"></span>
                </label>
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="sidebar-icon" 
          title="Color"
          onClick={() => setShowColorPicker(!showColorPicker)}
        >
          <Droplets size={20} />
        </button>
        
        {showColorPicker && (
          <div className="color-picker-dialog" ref={colorPickerRef}>
            <div className="color-picker-main">
              <div className="color-gradient-area">
                <div className="color-gradient"></div>
                <div className="color-cursor"></div>
              </div>
              <div className="hue-slider">
                <div className="hue-gradient"></div>
                <div className="hue-cursor"></div>
              </div>
            </div>
            
            <div className="color-picker-controls">
              <div className="current-color-display">
                <div className="color-swatch" style={{ backgroundColor: '#7878b6' }}></div>
                <input 
                  type="text" 
                  value="#7878b6" 
                  className="hex-input"
                />
              </div>
              
              <div className="color-swatches">
                <button className="add-color-btn">+</button>
                <div className="predefined-colors">
                  <div className="color-swatch-small" style={{ backgroundColor: '#000000' }}></div>
                  <div className="color-swatch-small" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}></div>
                  <div className="color-swatch-small" style={{ backgroundColor: '#3B82F6' }}></div>
                </div>
              </div>
              
              <div className="reset-background">
                <span>Reset background</span>
                <button className="reset-btn">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
