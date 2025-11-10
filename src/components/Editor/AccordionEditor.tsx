'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, MoreVertical, RotateCcw, Eye, Droplets, Trash2 } from 'lucide-react'
import { AccordionData } from '@/types'

interface AccordionEditorProps {
  data: AccordionData
  onChange: (data: AccordionData) => void
}

const AccordionEditor = ({ data, onChange }: AccordionEditorProps) => {
  const [formData, setFormData] = useState<AccordionData>({
    title: data.title || 'Untitled',
    description: data.description || '',
    items: data.items || []
  })

  const [showIconStyleDropdown, setShowIconStyleDropdown] = useState(false)
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [closingItems, setClosingItems] = useState<Set<string>>(new Set())
  const [iconStyle, setIconStyle] = useState<'plus' | 'number'>('plus')
  const [visibilityOptions, setVisibilityOptions] = useState({
    title: true,
    description: true
  })
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null)
  const [showItemColorPicker, setShowItemColorPicker] = useState<string | null>(null)
  const [itemColors, setItemColors] = useState<Record<string, string>>(data.itemColors || {})
  const [currentItemHue, setCurrentItemHue] = useState(240)
  const [currentItemSaturation, setCurrentItemSaturation] = useState(100)
  const [currentItemBrightness, setCurrentItemBrightness] = useState(50)
  const [isDraggingItem, setIsDraggingItem] = useState(false)
  const [dragTypeItem, setDragTypeItem] = useState<'hue' | 'saturation' | null>(null)

  const iconStyleRef = useRef<HTMLDivElement>(null)
  const visibilityRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  // Sync data.title with block.title when it changes
  useEffect(() => {
    if (data.title !== undefined && data.title !== formData.title) {
      setFormData(prev => ({ ...prev, title: data.title }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.title])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      if (iconStyleRef.current && !iconStyleRef.current.contains(target)) {
        setShowIconStyleDropdown(false)
      }
      if (visibilityRef.current && !visibilityRef.current.contains(target)) {
        setShowVisibilityDropdown(false)
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(false)
      }
      
      // Close item menu when clicking outside, but not on menu items
      if (showItemMenu && target instanceof Element && !target.closest('.accordion-item-menu-dropdown')) {
        console.log('Closing menu due to outside click')
        setShowItemMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showItemMenu, showVisibilityDropdown])

  // Mouse events for color picker
  useEffect(() => {
    if (isDraggingItem) {
      document.addEventListener('mousemove', handleItemMouseMove)
      document.addEventListener('mouseup', handleItemMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleItemMouseMove)
        document.removeEventListener('mouseup', handleItemMouseUp)
      }
    }
  }, [isDraggingItem, dragTypeItem, currentItemHue, currentItemSaturation, currentItemBrightness])

  const handleTitleChange = (e: React.FocusEvent<HTMLHeadingElement>) => {
    const updatedData = { ...formData, title: e.currentTarget.textContent || '', itemColors }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleDescriptionChange = (e: React.FocusEvent<HTMLDivElement>) => {
    const updatedData = { ...formData, description: e.currentTarget.textContent || '', itemColors }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const addNewItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      title: `Item ${formData.items.length + 1}`,
      description: '',
      isExpanded: false
    }
    const updatedData = { ...formData, items: [...formData.items, newItem], itemColors }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const updateItem = (id: string, field: 'title' | 'description', value: string) => {
    const updatedItems = formData.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    const updatedData = { ...formData, items: updatedItems, itemColors }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const deleteItem = (id: string) => {
    const updatedItems = formData.items.filter(item => item.id !== id)
    const updatedData = { ...formData, items: updatedItems, itemColors }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      // Start closing animation
      setClosingItems(prev => new Set(prev).add(id))
      // Remove from expanded after animation
      setTimeout(() => {
        newExpanded.delete(id)
        setExpandedItems(newExpanded)
        setClosingItems(prev => {
          const newClosing = new Set(prev)
          newClosing.delete(id)
          return newClosing
        })
      }, 300) // Match CSS animation duration
    } else {
      // Opening - remove from closing if it was there
      setClosingItems(prev => {
        const newClosing = new Set(prev)
        newClosing.delete(id)
        return newClosing
      })
      newExpanded.add(id)
      setExpandedItems(newExpanded)
    }
  }

  const handleIconStyleSelect = (style: 'plus' | 'number') => {
    setIconStyle(style)
    setShowIconStyleDropdown(false)
  }

  const handleItemMenuClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowItemMenu(showItemMenu === itemId ? null : itemId)
  }

  const handleDuplicateItem = (itemId: string) => {
    console.log('Duplicating item:', itemId)
    const itemToDuplicate = formData.items.find(item => item.id === itemId)
    console.log('Found item to duplicate:', itemToDuplicate)
    if (itemToDuplicate) {
      const newItem = {
        ...itemToDuplicate,
        id: `item-${Date.now()}`,
        title: itemToDuplicate.title
      }
      
      // Copy the custom color if it exists
      if (itemColors[itemId]) {
        setItemColors(prev => ({
          ...prev,
          [newItem.id]: itemColors[itemId]
        }))
      }
      
      console.log('Creating new item:', newItem)
      const updatedItems = [...formData.items, newItem]
      const updatedData = { ...formData, items: updatedItems }
      console.log('Updated items:', updatedItems)
      setFormData(updatedData)
      onChange(updatedData)
    }
    setShowItemMenu(null)
  }

  const handleDeleteItem = (itemId: string) => {
    console.log('Deleting item:', itemId)
    console.log('Current items before delete:', formData.items)
    const updatedItems = formData.items.filter(item => item.id !== itemId)
    console.log('Items after delete:', updatedItems)
    const updatedData = { ...formData, items: updatedItems }
    setFormData(updatedData)
    onChange(updatedData)
    setShowItemMenu(null)
  }

  // Color picker functions
  const hslToHexItem = (h: number, s: number, l: number) => {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    
    const hNorm = h / 360
    const sNorm = s / 100
    const lNorm = l / 100
    
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
    const x = c * (1 - Math.abs(((hNorm * 6) % 2) - 1))
    const m = lNorm - c / 2
    
    let r = 0, g = 0, b = 0
    
    if (hNorm < 1/6) {
      r = c; g = x; b = 0
    } else if (hNorm < 2/6) {
      r = x; g = c; b = 0
    } else if (hNorm < 3/6) {
      r = 0; g = c; b = x
    } else if (hNorm < 4/6) {
      r = 0; g = x; b = c
    } else if (hNorm < 5/6) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }
    
    return `#${toHex((r + m) * 255)}${toHex((g + m) * 255)}${toHex((b + m) * 255)}`
  }

  const updateItemColorFromHSL = (itemId: string) => {
    const hex = hslToHexItem(currentItemHue, currentItemSaturation, currentItemBrightness)
    const newItemColors = { ...itemColors, [itemId]: hex }
    setItemColors(newItemColors)
    
    // Update formData with the new colors
    const updatedData = { ...formData, itemColors: newItemColors }
    setFormData(updatedData)
    onChange(updatedData)
  }

  // Update color in real-time as user drags
  useEffect(() => {
    if (showItemColorPicker) {
      updateItemColorFromHSL(showItemColorPicker)
    }
  }, [currentItemHue, currentItemSaturation, currentItemBrightness, showItemColorPicker])

  const handleItemHueChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingItem || dragTypeItem !== 'hue') return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const hue = Math.max(0, Math.min(360, (y / rect.height) * 360))
    setCurrentItemHue(hue)
  }

  const handleItemSaturationBrightnessChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingItem || dragTypeItem !== 'saturation') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const saturation = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const brightness = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100))
    setCurrentItemSaturation(saturation)
    setCurrentItemBrightness(brightness)
  }

  const handleItemHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingItem(true)
    setDragTypeItem('hue')
    handleItemHueChange(e)
  }

  const handleItemSaturationMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingItem(true)
    setDragTypeItem('saturation')
    handleItemSaturationBrightnessChange(e)
  }

  const handleItemMouseMove = (e: MouseEvent) => {
    if (!isDraggingItem) return
    
    if (dragTypeItem === 'hue') {
      const hueSlider = document.querySelector('.item-color-hue-slider')
      if (hueSlider) {
        const rect = hueSlider.getBoundingClientRect()
        const y = e.clientY - rect.top
        const hue = Math.max(0, Math.min(360, (y / rect.height) * 360))
        setCurrentItemHue(hue)
      }
    } else if (dragTypeItem === 'saturation') {
      const saturationArea = document.querySelector('.item-color-saturation-area')
      if (saturationArea) {
        const rect = saturationArea.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const saturation = Math.max(0, Math.min(100, (x / rect.width) * 100))
        const brightness = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100))
        setCurrentItemSaturation(saturation)
        setCurrentItemBrightness(brightness)
      }
    }
  }

  const handleItemMouseUp = () => {
    setIsDraggingItem(false)
    setDragTypeItem(null)
  }

  const handleItemColorPick = (itemId: string) => {
    updateItemColorFromHSL(itemId)
    // Don't close immediately, let user see the result
    setTimeout(() => setShowItemColorPicker(null), 1000)
  }

  const handleItemColorReset = (itemId: string) => {
    setItemColors(prev => {
      const newColors = { ...prev }
      delete newColors[itemId]
      return newColors
    })
    setShowItemColorPicker(null)
  }

  return (
    <div className="accordion-editor">
      {/* Header */}
      <div className="accordion-editor-header">
        <div className="header-left-container">
        <button
            className="icon-style-btn"
            onClick={() => setShowIconStyleDropdown(!showIconStyleDropdown)}
          >
            <div className="icon-style-icon">
              <Plus size={12} />
            </div>
            <span>Icon style</span>
            <ChevronDown size={16} />
        </button>
          
          {showIconStyleDropdown && (
            <div className="icon-style-dropdown">
              <div 
                className="dropdown-option"
                onClick={() => handleIconStyleSelect('plus')}
              >
                <div className="dropdown-option-icon">
                  <Plus size={12} />
            </div>
                <span>Plus</span>
              </div>
              <div 
                className="dropdown-option"
                onClick={() => handleIconStyleSelect('number')}
              >
                <div className="dropdown-option-icon">
                  <span className="number-icon">1</span>
                </div>
                <span>Number</span>
              </div>
            </div>
          )}
            </div>
          </div>

      {/* Main Content */}
      <div className="accordion-content">
        <div className="accordion-main">
          <h1 
            className="accordion-title"
            contentEditable
            suppressContentEditableWarning
            onBlur={handleTitleChange}
            style={{ display: visibilityOptions.title ? 'block' : 'none' }}
          >
            {formData.title}
          </h1>
          
          <div 
            className="accordion-description"
            contentEditable
            suppressContentEditableWarning
            onBlur={handleDescriptionChange}
            style={{ display: visibilityOptions.description ? 'block' : 'none' }}
          >
            {formData.description || 'Add a description...'}
          </div>

          {/* Accordion Items */}
          <div className="accordion-items">
            {formData.items.map((item, index) => (
              <div key={item.id || `item-${index}`} className="accordion-item">
                <div className="accordion-item-header" onClick={() => toggleItem(item.id)}>
                  <div 
                    className="accordion-item-icon"
                    style={{ backgroundColor: itemColors[item.id] || '#3b82f6' }}
                  >
                    {iconStyle === 'plus' ? (
                      expandedItems.has(item.id) ? (
                        <span className="accordion-icon-x">×</span>
                      ) : (
                        <Plus size={12} />
                      )
                    ) : (
                      <span className="accordion-item-number">{index + 1}</span>
        )}
      </div>
                  <div className="accordion-item-content">
                    <div 
                      className="accordion-item-title"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateItem(item.id, 'title', e.currentTarget.textContent || '')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.title}
                    </div>
                  </div>
                  <button 
                    className="accordion-item-menu"
                    onClick={(e) => handleItemMenuClick(item.id, e)}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
                {(expandedItems.has(item.id) || closingItems.has(item.id)) && (
                  <div className={`accordion-item-body ${closingItems.has(item.id) ? 'closing' : 'opening'}`}>
                    <div 
                      className="accordion-item-description"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateItem(item.id, 'description', e.currentTarget.textContent || '')}
                    >
                      {item.description || 'Add a description'}
                    </div>
                  </div>
                )}
                
                {/* Item Menu Dropdown */}
                {showItemMenu === item.id && (
                  <div className="accordion-item-menu-dropdown">
                    <div className="menu-option" onClick={() => {
                      setShowItemColorPicker(item.id)
                      setShowItemMenu(null)
                    }}>
                      <Droplets size={16} />
                      <span>Override color</span>
                    </div>
                    <div className="menu-option" onClick={(e) => {
                      e.stopPropagation()
                      console.log('Duplicate clicked for item:', item.id)
                      handleDuplicateItem(item.id)
                    }}>
                      <Plus size={16} />
                      <span>Duplicate</span>
                    </div>
                    <div className="menu-option delete-option" onClick={(e) => {
                      e.stopPropagation()
                      console.log('Delete clicked for item:', item.id)
                      handleDeleteItem(item.id)
                    }}>
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </div>
                  </div>
                )}
                
                {/* Item Color Picker */}
                {showItemColorPicker === item.id && (
                  <div className="item-color-picker-container">
                    <div className="item-color-picker-header">
                      <span>Choose Color</span>
                      <button 
                        className="close-color-picker"
                        onClick={() => setShowItemColorPicker(null)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="item-color-picker-content">
                      <div className="item-color-picker-main">
                        <div 
                          className="item-color-saturation-area"
                          style={{ 
                            background: `linear-gradient(to right, white, hsl(${currentItemHue}, 100%, 50%)), linear-gradient(to bottom, transparent, black)`,
                            '--hue': currentItemHue 
                          } as React.CSSProperties}
                          onMouseDown={handleItemSaturationMouseDown}
                        >
                          <div 
                            className="item-color-saturation-selector"
                            style={{
                              left: `${currentItemSaturation}%`,
                              top: `${100 - currentItemBrightness}%`
                            }}
                          />
                        </div>
                        <div 
                          className="item-color-hue-slider"
                          onMouseDown={handleItemHueMouseDown}
                        >
                          <div 
                            className="item-color-hue-handle"
                            style={{ top: `${(currentItemHue / 360) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="item-color-picker-preview">
                        <div 
                          className="item-color-preview-swatch"
                          style={{ backgroundColor: hslToHexItem(currentItemHue, currentItemSaturation, currentItemBrightness) }}
                        />
                        <input 
                          type="text"
                          className="item-color-hex-input"
                          value={hslToHexItem(currentItemHue, currentItemSaturation, currentItemBrightness)}
                          readOnly
                        />
                      </div>
                      <div className="item-color-picker-presets">
                        <div className="preset-add">+</div>
                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff', '#000000', '#6b7280'].map(color => (
                          <div 
                            key={color}
                            className="preset-color"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              // Convert hex to HSL
                              const hex = color.replace('#', '')
                              const r = parseInt(hex.substr(0, 2), 16) / 255
                              const g = parseInt(hex.substr(2, 2), 16) / 255
                              const b = parseInt(hex.substr(4, 2), 16) / 255
                              
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
                              
                              setCurrentItemHue(Math.round(h * 360))
                              setCurrentItemSaturation(Math.round(s * 100))
                              setCurrentItemBrightness(Math.round(l * 100))
                            }}
                          />
                        ))}
                      </div>
                      <div className="item-color-picker-reset">
                        <span>Reset to default</span>
                        <button 
                          className="reset-btn"
                          onClick={() => handleItemColorReset(item.id)}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    <div className="item-color-picker-actions">
                      <button 
                        className="close-btn"
                        onClick={() => setShowItemColorPicker(null)}
                      >
                        Close
                </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <button className="add-item-btn" onClick={addNewItem}>
              Add item
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="accordion-sidebar">
          <button className="sidebar-icon">
            <RotateCcw size={16} />
          </button>
          <button 
            className="sidebar-icon"
            onClick={() => {
              console.log('Eye icon clicked, current state:', showVisibilityDropdown)
              setShowVisibilityDropdown(!showVisibilityDropdown)
            }}
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
              <label className="accordion-visibility-checkbox">
                <input 
                  type="checkbox" 
                  checked={visibilityOptions.title}
                  onChange={(e) => setVisibilityOptions(prev => ({ ...prev, title: e.target.checked }))}
                />
                <span className="accordion-visibility-checkmark"></span>
              </label>
            </div>
            <div className="visibility-option">
              <span className="option-label">Description</span>
              <label className="accordion-visibility-checkbox">
                <input 
                  type="checkbox" 
                  checked={visibilityOptions.description}
                  onChange={(e) => setVisibilityOptions(prev => ({ ...prev, description: e.target.checked }))}
                />
                <span className="accordion-visibility-checkmark"></span>
              </label>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default AccordionEditor