'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Image, 
  Layout, 
  Upload, 
  Eye, 
  Droplets,
  RotateCcw,
  Crop,
  Move,
  Maximize2,
  Square
} from 'lucide-react'
import { TextImageData } from '@/types'
import '../../app/editor/new/text-image-editor.css'

interface TextImageEditorProps {
  data: TextImageData
  onChange: (data: TextImageData) => void
}

export default function TextImageEditor({ data, onChange }: TextImageEditorProps) {
  const [formData, setFormData] = useState<TextImageData>({
    layout: data.layout || 'right',
    image: data.image || '',
    content: data.content || '',
    title: data.title || 'Untitled',
    altText: data.altText || ''
  })

  // Update formData when data prop changes (especially title and content from block.data)
  useEffect(() => {
    if (data.title !== undefined && data.title !== formData.title) {
      setFormData(prev => ({ ...prev, title: data.title }))
    }
    if (data.content !== undefined && data.content !== formData.content && data.content !== '') {
      setFormData(prev => ({ ...prev, content: data.content }))
    }
    // Also check for "body" field (from AI generation) and map it to "content"
    if (data.body !== undefined && data.body !== formData.content && data.body !== '') {
      setFormData(prev => ({ ...prev, content: data.body }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.title, data.content, data.body])

  // Update contentEditable element when formData.content changes
  useEffect(() => {
    if (bodyContentRef.current && formData.content && bodyContentRef.current.textContent !== formData.content) {
      bodyContentRef.current.textContent = formData.content
    }
  }, [formData.content])
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false)
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#7878b6')
  const [hue, setHue] = useState(240)
  const [saturation, setSaturation] = useState(30)
  const [lightness, setLightness] = useState(60)
  const [visibilityOptions, setVisibilityOptions] = useState({
    title: true,
    description: true
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const visibilityRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const bodyContentRef = useRef<HTMLDivElement>(null)

  const layoutOptions = [
    { value: 'behind', label: 'Image behind', icon: '🖼️' },
    { value: 'left', label: 'Image left', icon: '📄' },
    { value: 'right', label: 'Image right', icon: '📄' },
    { value: 'none', label: 'No image', icon: '☰' }
  ]

  const handleChange = (field: keyof TextImageData, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChange(newData)
  }

  // Color conversion functions
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100
    const a = s * Math.min(l, 1 - l) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  const updateColor = (newHue: number, newSaturation: number, newLightness: number) => {
    setHue(newHue)
    setSaturation(newSaturation)
    setLightness(newLightness)
    const hex = hslToHex(newHue, newSaturation, newLightness)
    setSelectedColor(hex)
  }

  const handleHexChange = (hex: string) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setSelectedColor(hex)
      const { h, s, l } = hexToHsl(hex)
      setHue(h)
      setSaturation(s)
      setLightness(l)
    }
  }

  const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newSaturation = (x / rect.width) * 100
    const newLightness = 100 - (y / rect.height) * 100
    console.log('Gradient clicked:', { x, y, newSaturation, newLightness, hue })
    updateColor(hue, newSaturation, newLightness)
  }

  const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const newHue = (y / rect.height) * 360
    console.log('Hue clicked:', { y, newHue, saturation, lightness })
    updateColor(newHue, saturation, lightness)
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

  // Initialize contentEditable hooks
  const titleEditable = useContentEditable(
    formData.title,
    (value) => handleChange('title', value)
  )
  const descriptionEditable = useContentEditable(
    formData.content || 'When we are clear about things, we have knowledge; with knowledge, we seek the path of truth; when the search is rewarded, the heart becomes good; with the heart made good, the moral view of things that leads to virtue is attained. — Confucius',
    (value) => handleChange('content', value)
  )

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        handleChange('image', e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLayoutDropdown(false)
      }
      if (visibilityRef.current && !visibilityRef.current.contains(event.target as Node)) {
        setShowVisibilityDropdown(false)
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
    }

    if (showLayoutDropdown || showVisibilityDropdown || showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLayoutDropdown, showVisibilityDropdown, showColorPicker])

  return (
    <div className="text-image-editor">
      {/* Top Toolbar */}
      <div className="text-image-toolbar">
        <div className="toolbar-center">
          <div className="toolbar-group">
            <div className="layout-dropdown-container" ref={dropdownRef}>
              <button
                className="toolbar-button"
                onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
              >
                <Layout size={16} />
                Layout
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {showLayoutDropdown && (
                <div className="layout-dropdown">
                  {layoutOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`layout-option ${formData.layout === option.value ? 'selected' : ''}`}
                      onClick={() => {
                        handleChange('layout', option.value)
                        setShowLayoutDropdown(false)
                      }}
                    >
                      <span className="layout-icon">{option.icon}</span>
                      <span className="layout-label">{option.label}</span>
              </button>
            ))}
          </div>
              )}
            </div>
            
            <div className="black-button-group">
              <button 
                className="toolbar-button"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = handleImageUpload
                  input.click()
                }}
              >
                <RotateCcw size={16} />
                Replace image
              </button>
              <button className="toolbar-button">
                <Crop size={16} />
                Edit image
              </button>
              <button className="toolbar-button">
                Alt text
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className={`text-image-content layout-${formData.layout}`}
        style={formData.layout === 'behind' && formData.image ? {
          backgroundImage: `url(${formData.image})`
        } : {}}
      >
        {/* Text Section */}
        <div className="text-section">
          <div className="text-content">
            {visibilityOptions.title && (
              <h1 
                contentEditable
                suppressContentEditableWarning
                className="text-title"
                onInput={(e) => {
                  // Don't update state during typing to prevent re-rendering
                  console.log('Text-Image Title Input (no state update):', e.currentTarget.textContent)
                }}
                onBlur={(e) => {
                  const value = e.currentTarget.textContent || ''
                  console.log('Text-Image Title Blur (updating state):', { value })
                  handleChange('title', value)
                }}
              >
                {formData.title}
              </h1>
            )}
            
            {visibilityOptions.description && (
              <div 
                ref={bodyContentRef}
                contentEditable
                suppressContentEditableWarning
                className="text-body"
                onInput={(e) => {
                  // Don't update state during typing to prevent re-rendering
                  console.log('Text-Image Description Input (no state update):', e.currentTarget.textContent)
                }}
                onBlur={(e) => {
                  const value = e.currentTarget.textContent || ''
                  console.log('Text-Image Description Blur (updating state):', { value })
                  handleChange('content', value)
                }}
              >
                {formData.content || ''}
              </div>
            )}
          </div>
        </div>

        {/* Image Section - Only show if layout is not 'none' */}
        {formData.layout !== 'none' && (
          <div className="image-section">
            <div className="image-container">
              {formData.image ? (
                  <img
                    src={formData.image}
                  alt={formData.altText}
                  className="main-image"
                />
              ) : (
                <div className="image-placeholder">
                  <Upload size={48} />
                  <p>Upload an image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="image-upload-input"
                  />
                </div>
              )}
              
              {/* Image Overlay Controls */}
              {formData.image && (
                <div className="image-controls">
                  <button className="control-button" title="Fit to frame">
                    <Maximize2 size={16} />
                  </button>
                  <button className="control-button" title="Fill frame">
                    <Square size={16} />
                  </button>
                  <button className="control-button" title="Crop">
                    <Crop size={16} />
                  </button>
                  <button className="control-button" title="Move">
                    <Move size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar Icons */}
      <div className="text-image-sidebar">
        <div className="sidebar-icon-container" ref={visibilityRef}>
          <button 
            className="sidebar-icon" 
            title="Preview"
            onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
          >
            <Eye size={20} />
          </button>
          
          {showVisibilityDropdown && (
            <div className="visibility-dropdown">
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
              <div 
                className="color-gradient-area"
                onClick={handleGradientClick}
                style={{ 
                  background: `linear-gradient(to right, hsl(${hue}, 100%, 50%), hsl(${hue}, 0%, 50%)), linear-gradient(to bottom, transparent, black)`
                }}
              >
                <div 
                  className="color-cursor"
                  style={{
                    left: `${saturation}%`,
                    top: `${100 - lightness}%`
                  }}
                ></div>
              </div>
              <div 
                className="hue-slider"
                onClick={handleHueClick}
              >
                <div className="hue-gradient"></div>
                <div 
                  className="hue-cursor"
                  style={{
                    top: `${(hue / 360) * 100}%`
                  }}
                ></div>
              </div>
            </div>
            
            <div className="color-picker-controls">
              <div className="current-color-display">
                <div 
                  className="color-swatch" 
                  style={{ backgroundColor: selectedColor }}
                ></div>
                <input 
                  type="text" 
                  value={selectedColor} 
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="hex-input"
                />
              </div>
              
              <div className="color-swatches">
                <button className="add-color-btn">+</button>
                <div className="predefined-colors">
                  <div 
                    className="color-swatch-small" 
                    style={{ backgroundColor: '#000000' }}
                    onClick={() => handleHexChange('#000000')}
                  ></div>
                  <div 
                    className="color-swatch-small" 
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                    onClick={() => handleHexChange('#FFFFFF')}
                  ></div>
                  <div 
                    className="color-swatch-small" 
                    style={{ backgroundColor: '#3B82F6' }}
                    onClick={() => handleHexChange('#3B82F6')}
                  ></div>
                </div>
              </div>
              
              <div className="reset-background">
                <span>Reset background</span>
                <button 
                  className="reset-btn"
                  onClick={() => {
                    setSelectedColor('#7878b6')
                    setHue(240)
                    setSaturation(30)
                    setLightness(60)
                  }}
                >
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
