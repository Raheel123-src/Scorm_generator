'use client'

import { useState, useRef, useEffect } from 'react'
import { HotspotImageData } from '@/types'
import { Plus, ChevronDown, RotateCcw, Crop, Eye, List, Droplets, Trash2 } from 'lucide-react'
import '../../app/editor/new/hotspot-image-editor.css'

interface HotspotImageEditorProps {
  data: HotspotImageData
  onChange: (data: HotspotImageData) => void
}

const HotspotImageEditor = ({ data, onChange }: HotspotImageEditorProps) => {
  const [formData, setFormData] = useState<HotspotImageData>(data)
  const [showIconStyleDropdown, setShowIconStyleDropdown] = useState(false)
  const [isAddingHotspot, setIsAddingHotspot] = useState(false)
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null)
  const [showHotspotMenu, setShowHotspotMenu] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [hotspotColor, setHotspotColor] = useState('#3b82f6')

  const iconStyleDropdownRef = useRef<HTMLDivElement>(null)
  const hotspotMenuRef = useRef<HTMLDivElement>(null)

  const updateFormData = (updates: Partial<HotspotImageData>) => {
    const newData = { ...formData, ...updates }
    setFormData(newData)
    onChange(newData)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        updateFormData({ imageUrl })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isAddingHotspot) {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100
      
      const newHotspot = {
        id: `hotspot-${Date.now()}`,
        x,
        y,
        title: 'New Hotspot',
        description: 'Click to edit'
      }
      
      updateFormData({
        hotspots: [...formData.hotspots, newHotspot]
      })
      setIsAddingHotspot(false)
    } else {
      setSelectedHotspot(null)
      setShowHotspotMenu(null)
    }
  }

  const handleHotspotClick = (hotspotId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedHotspot(hotspotId)
    setShowHotspotMenu(null)
  }

  const handleMenuButtonClick = (hotspotId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setShowHotspotMenu(showHotspotMenu === hotspotId ? null : hotspotId)
  }

  const updateHotspot = (hotspotId: string, updates: Partial<any>) => {
    updateFormData({
      hotspots: formData.hotspots.map(hotspot =>
        hotspot.id === hotspotId ? { ...hotspot, ...updates } : hotspot
      )
    })
  }

  const deleteHotspot = (hotspotId: string) => {
    updateFormData({
      hotspots: formData.hotspots.filter(hotspot => hotspot.id !== hotspotId)
    })
    setSelectedHotspot(null)
    setShowHotspotMenu(null)
  }

  const handleColorChange = (color: string) => {
    if (showColorPicker === 'global') {
      setHotspotColor(color)
    } else if (showColorPicker) {
      updateHotspot(showColorPicker, { color })
    }
    setShowColorPicker(null)
  }

  const getCardTransform = (x: number, y: number) => {
    // Determine quadrant based on position
    const isRightSide = x > 50
    const isTopSide = y < 50
    
    if (isRightSide && isTopSide) {
      // Quadrant 1 (top right) - position bottom left of hotspot
      return 'translateX(-100%) translateY(20px)'
    } else if (!isRightSide && isTopSide) {
      // Quadrant 2 (top left) - position bottom right of hotspot
      return 'translateX(20px) translateY(20px)'
    } else if (!isRightSide && !isTopSide) {
      // Quadrant 3 (bottom left) - position top right of hotspot
      return 'translateX(20px) translateY(-100%)'
    } else {
      // Quadrant 4 (bottom right) - position top left of hotspot
      return 'translateX(-100%) translateY(-100%)'
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconStyleDropdownRef.current && !iconStyleDropdownRef.current.contains(event.target as Node)) {
        setShowIconStyleDropdown(false)
      }
      if (hotspotMenuRef.current && !hotspotMenuRef.current.contains(event.target as Node)) {
        setShowHotspotMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="hotspot-image-editor">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <button 
            className={`add-hotspot-btn ${isAddingHotspot ? 'active' : ''}`}
            onClick={() => setIsAddingHotspot(!isAddingHotspot)}
          >
            <Plus size={16} />
            Add hotspot
          </button>
          
          <div className="icon-style-container" ref={iconStyleDropdownRef}>
            <button 
              className="icon-style-btn"
              onClick={() => setShowIconStyleDropdown(!showIconStyleDropdown)}
            >
              <div className="icon-style-icon">
                <Plus size={12} />
              </div>
              Icon style
              <ChevronDown size={14} />
            </button>
            
            {showIconStyleDropdown && (
              <div className="icon-style-dropdown">
                <div className="dropdown-option">
                  <div className="dropdown-option-icon">1</div>
                  <span>Number</span>
                </div>
                <div className="dropdown-option">
                  <div className="dropdown-option-icon">+</div>
                  <span>Plus</span>
                </div>
                <div className="dropdown-option">
                  <div className="dropdown-option-icon">•</div>
                  <span>Dot</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="top-bar-right">
          <button className="header-btn">
            <RotateCcw size={16} />
            Replace image
          </button>
          
          <button className="header-btn">
            <Crop size={16} />
            Edit image
          </button>
          
          <button className="header-btn">
            Alt text
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {/* Content Header */}
        <div className="content-header">
          <input
            type="text"
            className="title-input"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="Untitled"
          />
          <div
            className="description-input"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateFormData({ description: e.currentTarget.textContent || '' })}
          >
            {formData.description || 'Add a description'}
          </div>
        </div>

        {/* Image Container */}
        <div className="image-container" onClick={handleImageClick}>
          {formData.imageUrl ? (
            <div className="image-wrapper">
              <img 
                src={formData.imageUrl} 
                alt={formData.altText} 
                className="main-image"
              />
              
              {/* Hotspots */}
              {formData.hotspots.map((hotspot) => (
                <div key={hotspot.id}>
                  <div
                    className={`hotspot-marker ${selectedHotspot === hotspot.id ? 'selected' : ''}`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      backgroundColor: hotspot.color || hotspotColor
                    }}
                    onClick={(e) => handleHotspotClick(hotspot.id, e)}
                  >
                    <Plus size={12} />
                  </div>
                  
                  {/* Hotspot Edit Card */}
                  {selectedHotspot === hotspot.id && (
                    <div 
                      className="hotspot-edit-card" 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                        transform: getCardTransform(hotspot.x, hotspot.y)
                      }}
                    >
                      {/* Hotspot Menu */}
                      <div className="hotspot-menu-dropdown" ref={hotspotMenuRef}>
                        <button 
                          className="hotspot-menu-button"
                          onClick={(e) => handleMenuButtonClick(hotspot.id, e)}
                        >
                          <div className="hotspot-menu-dots">
                            <div></div>
                            <div></div>
                            <div></div>
                          </div>
                        </button>
                        
                        {showHotspotMenu === hotspot.id && (
                          <div className="hotspot-menu">
                            <button 
                              className="hotspot-menu-item"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowColorPicker(hotspot.id)
                              }}
                            >
                              <Droplets size={16} />
                              Override color
                            </button>
                            <button 
                              className="hotspot-menu-item"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteHotspot(hotspot.id)
                              }}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="hotspot-edit-content">
                        <input
                          type="text"
                          className="hotspot-edit-input"
                          value={hotspot.title}
                          onChange={(e) => updateHotspot(hotspot.id, { title: e.target.value })}
                          placeholder="Hotspot title"
                        />
                        <textarea
                          className="hotspot-edit-textarea"
                          value={hotspot.description}
                          onChange={(e) => updateHotspot(hotspot.id, { description: e.target.value })}
                          placeholder="Hotspot description"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="image-placeholder">
              <div className="placeholder-content">
                <div className="placeholder-icon">
                  <Plus size={48} />
                </div>
                <h3>Upload an image</h3>
                <p>Click to browse or drag and drop</p>
                <input
                  type="file"
                  accept="image/*"
                  className="image-upload-input"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        <div className="sidebar-icon">
          <List size={20} />
        </div>
        <div className="sidebar-icon">
          <Eye size={20} />
        </div>
        <div className="sidebar-icon">
          <Droplets size={20} />
        </div>
      </div>

      {/* Color Picker */}
      {showColorPicker && (
        <div className="color-picker-overlay" onClick={() => setShowColorPicker(null)}>
          <div className="color-picker" onClick={(e) => e.stopPropagation()}>
            <div className="color-picker-header">Choose Color</div>
            <div className="color-picker-grid">
              {[
                '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
                '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
                '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'
              ].map((color) => (
                <div
                  key={color}
                  className="color-option"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HotspotImageEditor
