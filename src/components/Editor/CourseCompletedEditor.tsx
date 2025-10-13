'use client'

import { useState, useRef, useEffect } from 'react'
import { CourseCompletedData } from '@/types'
import { ChevronDown, Image, Settings, List, Droplets, ChevronLeft, Square, AlignLeft, AlignRight, Type } from 'lucide-react'
import './course-completed-editor.css'

interface CourseCompletedEditorProps {
  data: CourseCompletedData
  onChange: (data: CourseCompletedData) => void
}

const CourseCompletedEditor = ({ data, onChange }: CourseCompletedEditorProps) => {
  const [formData, setFormData] = useState<CourseCompletedData>(data)
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false)
  const [showConfettiDropdown, setShowConfettiDropdown] = useState(false)

  const layoutDropdownRef = useRef<HTMLDivElement>(null)
  const confettiDropdownRef = useRef<HTMLDivElement>(null)

  const updateFormData = (updates: Partial<CourseCompletedData>) => {
    const newData = { ...formData, ...updates }
    setFormData(newData)
    onChange(newData)
  }


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(event.target as Node)) {
        setShowLayoutDropdown(false)
      }
      if (confettiDropdownRef.current && !confettiDropdownRef.current.contains(event.target as Node)) {
        setShowConfettiDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      className="course-completed-editor"
      style={{
        background: formData.layout === 'image-behind' && formData.backgroundImage
          ? `url(${formData.backgroundImage}) center/cover`
          : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)'
      }}
    >
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <div className="dropdown-container" ref={layoutDropdownRef}>
            <button 
              className="dropdown-btn"
              onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
            >
              <Settings size={16} />
              Layout
              <ChevronDown size={14} />
            </button>
            
            {showLayoutDropdown && (
              <div className="dropdown-menu">
                <div 
                  className={`dropdown-option ${formData.layout === 'image-behind' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ layout: 'image-behind' })}
                >
                  <Square size={16} />
                  Image behind
                </div>
                <div 
                  className={`dropdown-option ${formData.layout === 'image-left' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ layout: 'image-left' })}
                >
                  <AlignLeft size={16} />
                  Image left
                </div>
                <div 
                  className={`dropdown-option ${formData.layout === 'image-right' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ layout: 'image-right' })}
                >
                  <AlignRight size={16} />
                  Image right
                </div>
                <div 
                  className={`dropdown-option ${formData.layout === 'no-image' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ layout: 'no-image' })}
                >
                  <Type size={16} />
                  No image
                </div>
              </div>
            )}
          </div>
          
          <div className="dropdown-container" ref={confettiDropdownRef}>
            <button 
              className="dropdown-btn"
              onClick={() => setShowConfettiDropdown(!showConfettiDropdown)}
            >
              <Droplets size={16} />
              Confetti
              <ChevronDown size={14} />
            </button>
            
            {showConfettiDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-option">None</div>
                <div className="dropdown-option">Subtle</div>
                <div className="dropdown-option">Celebration</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="top-bar-right">
          {formData.layout === 'image-behind' && (
            <button 
              className="background-btn"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      const imageUrl = e.target?.result as string
                      updateFormData({ backgroundImage: imageUrl })
                    }
                    reader.readAsDataURL(file)
                  }
                }
                input.click()
              }}
            >
              <Image size={16} />
              Add background image
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="content-area">
        {formData.layout === 'image-left' ? (
          <div className="image-left-layout">
            {/* Image Section */}
            <div className="image-section">
              {formData.layoutImage ? (
                <div 
                  className="image-container"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (e) => {
                          const imageUrl = e.target?.result as string
                          updateFormData({ layoutImage: imageUrl })
                        }
                        reader.readAsDataURL(file)
                      }
                    }
                    input.click()
                  }}
                >
                  <img 
                    src={formData.layoutImage} 
                    alt="Course completed" 
                    className="layout-image"
                  />
                  <div className="image-overlay">
                    <Image size={24} />
                    <span>Click to replace</span>
                  </div>
                </div>
              ) : (
                <div 
                  className="image-placeholder"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (e) => {
                          const imageUrl = e.target?.result as string
                          updateFormData({ layoutImage: imageUrl })
                        }
                        reader.readAsDataURL(file)
                      }
                    }
                    input.click()
                  }}
                >
                  <Image size={48} />
                  <span>Add an image</span>
                </div>
              )}
            </div>
            
            {/* Content Section */}
            <div className="content-section">
              <input
                type="text"
                className="main-title"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="You're all done!"
              />
              
              <input
                type="text"
                className="subtitle"
                value={formData.subtitle}
                onChange={(e) => updateFormData({ subtitle: e.target.value })}
                placeholder="How was your course experience?"
              />
              
              <div className="emoji-feedback">
                <button 
                  className={`emoji-btn ${formData.selectedEmoji === 'sad' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ selectedEmoji: 'sad' })}
                >
                  😢
                </button>
                <button 
                  className={`emoji-btn ${formData.selectedEmoji === 'neutral' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ selectedEmoji: 'neutral' })}
                >
                  😐
                </button>
                <button 
                  className={`emoji-btn ${formData.selectedEmoji === 'happy' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ selectedEmoji: 'happy' })}
                >
                  😊
                </button>
              </div>
              
              <button className="cta-button">
                {formData.ctaText}
              </button>
            </div>
          </div>
        ) : formData.layout === 'image-behind' ? (
          <div className="image-behind-layout">
            <div className="course-completed-content">
              <input
                type="text"
                className="main-title"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="You're all done!"
              />
            
            <input
              type="text"
              className="subtitle"
              value={formData.subtitle}
              onChange={(e) => updateFormData({ subtitle: e.target.value })}
              placeholder="How was your course experience?"
            />
            
            <div className="emoji-feedback">
              <button 
                className={`emoji-btn ${formData.selectedEmoji === 'sad' ? 'selected' : ''}`}
                onClick={() => updateFormData({ selectedEmoji: 'sad' })}
              >
                😢
              </button>
              <button 
                className={`emoji-btn ${formData.selectedEmoji === 'neutral' ? 'selected' : ''}`}
                onClick={() => updateFormData({ selectedEmoji: 'neutral' })}
              >
                😐
              </button>
              <button 
                className={`emoji-btn ${formData.selectedEmoji === 'happy' ? 'selected' : ''}`}
                onClick={() => updateFormData({ selectedEmoji: 'happy' })}
              >
                😊
              </button>
            </div>
            
              <button className="cta-button">
                {formData.ctaText}
              </button>
            </div>
          </div>
        ) : formData.layout === 'image-right' ? (
          <div className="image-right-layout">
            {/* Content Section */}
            <div className="content-section">
              <input
                type="text"
                className="main-title"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="You're all done!"
              />
              
              <input
                type="text"
                className="subtitle"
                value={formData.subtitle}
                onChange={(e) => updateFormData({ subtitle: e.target.value })}
                placeholder="How was your course experience?"
              />
              
              <div className="emoji-feedback">
                <button 
                  className={`emoji-btn ${formData.selectedEmoji === 'sad' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ selectedEmoji: 'sad' })}
                >
                  😢
                </button>
                <button 
                  className={`emoji-btn ${formData.selectedEmoji === 'neutral' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ selectedEmoji: 'neutral' })}
                >
                  😐
                </button>
                <button 
                  className={`emoji-btn ${formData.selectedEmoji === 'happy' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ selectedEmoji: 'happy' })}
                >
                  😊
                </button>
              </div>
              
              <button className="cta-button">
                {formData.ctaText}
              </button>
            </div>
            
            {/* Image Section */}
            <div className="image-section">
              {formData.layoutImage ? (
                <div 
                  className="image-container"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (e) => {
                          const imageUrl = e.target?.result as string
                          updateFormData({ layoutImage: imageUrl })
                        }
                        reader.readAsDataURL(file)
                      }
                    }
                    input.click()
                  }}
                >
                  <img 
                    src={formData.layoutImage} 
                    alt="Course completed" 
                    className="layout-image"
                  />
                  <div className="image-overlay">
                    <Image size={24} />
                    <span>Click to replace</span>
                  </div>
                </div>
              ) : (
                <div 
                  className="image-placeholder"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (e) => {
                          const imageUrl = e.target?.result as string
                          updateFormData({ layoutImage: imageUrl })
                        }
                        reader.readAsDataURL(file)
                      }
                    }
                    input.click()
                  }}
                >
                  <Image size={48} />
                  <span>Add an image</span>
                </div>
              )}
            </div>
          </div>
        ) : formData.layout === 'no-image' ? (
          <div className="no-image-layout">
            <div className="course-completed-content">
              <input
                type="text"
                className="main-title"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="You're all done!"
              />
              
              <input
                type="text"
                className="subtitle"
                value={formData.subtitle}
                onChange={(e) => updateFormData({ subtitle: e.target.value })}
                placeholder="How was your course experience?"
              />
              
              <div className="emoji-feedback">
                <button 
                  className={`emoji-btn ${formData.selectedEmoji === 'sad' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ selectedEmoji: 'sad' })}
                >
                  😢
                </button>
                <button 
                  className={`emoji-btn ${formData.selectedEmoji === 'neutral' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ selectedEmoji: 'neutral' })}
                >
                  😐
                </button>
                <button 
                  className={`emoji-btn ${formData.selectedEmoji === 'happy' ? 'selected' : ''}`}
                  onClick={() => updateFormData({ selectedEmoji: 'happy' })}
                >
                  😊
                </button>
              </div>
              
              <button className="cta-button">
                {formData.ctaText}
              </button>
            </div>
          </div>
        ) : (
          <div className="course-completed-content">
            <input
              type="text"
              className="main-title"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              placeholder="You're all done!"
            />
            
            <input
              type="text"
              className="subtitle"
              value={formData.subtitle}
              onChange={(e) => updateFormData({ subtitle: e.target.value })}
              placeholder="How was your course experience?"
            />
            
            <div className="emoji-feedback">
              <button 
                className={`emoji-btn ${formData.selectedEmoji === 'sad' ? 'selected' : ''}`}
                onClick={() => updateFormData({ selectedEmoji: 'sad' })}
              >
                😢
              </button>
              <button 
                className={`emoji-btn ${formData.selectedEmoji === 'neutral' ? 'selected' : ''}`}
                onClick={() => updateFormData({ selectedEmoji: 'neutral' })}
              >
                😐
              </button>
              <button 
                className={`emoji-btn ${formData.selectedEmoji === 'happy' ? 'selected' : ''}`}
                onClick={() => updateFormData({ selectedEmoji: 'happy' })}
              >
                😊
              </button>
            </div>
            
            <button className="cta-button">
              {formData.ctaText}
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        <div className="sidebar-icon">
          <Settings size={20} />
        </div>
        <div className="sidebar-icon">
          <List size={20} />
        </div>
        <div className="sidebar-icon">
          <Droplets size={20} />
        </div>
      </div>

      {/* Left Navigation */}
      <div className="left-nav">
        <button className="nav-btn">
          <ChevronLeft size={16} />
        </button>
      </div>

    </div>
  )
}

export default CourseCompletedEditor
