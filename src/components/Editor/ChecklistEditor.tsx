'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  GripVertical, 
  MoreVertical,
  RotateCcw,
  Eye,
  Droplets,
  CheckCheck,
  Sparkles,
  Link,
  Bold,
  Italic,
  ChevronDown
} from 'lucide-react'
import { ChecklistData } from '@/types'

interface ChecklistEditorProps {
  data: ChecklistData
  onChange: (data: ChecklistData) => void
}

export default function ChecklistEditor({ data, onChange }: ChecklistEditorProps) {
  const [formData, setFormData] = useState<ChecklistData>({
    title: data.title || 'Untitled',
    items: data.items || []
  })
  
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null)
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [visibilityOptions, setVisibilityOptions] = useState({
    title: true,
    description: true
  })

  const visibilityRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      if (visibilityRef.current && !visibilityRef.current.contains(target)) {
        setShowVisibilityDropdown(false)
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(false)
      }
      if (showItemMenu && target instanceof Element && !target.closest('.checklist-item-menu-dropdown')) {
        setShowItemMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showItemMenu, showVisibilityDropdown])

  const handleTitleChange = (e: React.FocusEvent<HTMLHeadingElement>) => {
    const updatedData = { ...formData, title: e.currentTarget.textContent || '' }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      text: 'Untitled',
      checked: false
    }
    const updatedData = { ...formData, items: [...formData.items, newItem] }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleUpdateItem = (id: string, field: 'text' | 'checked', value: string | boolean) => {
    const updatedData = {
      ...formData,
      items: formData.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleDeleteItem = (id: string) => {
    const updatedData = {
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    }
    setFormData(updatedData)
    onChange(updatedData)
    setShowItemMenu(null)
  }

  const handleDuplicateItem = (id: string) => {
    const itemToDuplicate = formData.items.find(item => item.id === id)
    if (itemToDuplicate) {
      const newItem = {
        ...itemToDuplicate,
        id: `item-${Date.now()}`,
        text: itemToDuplicate.text
      }
      
      const updatedData = { ...formData, items: [...formData.items, newItem] }
      setFormData(updatedData)
      onChange(updatedData)
    }
    setShowItemMenu(null)
  }

  const handleItemMenuClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowItemMenu(showItemMenu === itemId ? null : itemId)
  }

  const handleCheckboxClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const item = formData.items.find(item => item.id === itemId)
    if (item) {
      handleUpdateItem(itemId, 'checked', !item.checked)
    }
  }

  return (
    <div className="checklist-editor">
      {/* Rich Text Toolbar */}
      <div className="checklist-toolbar">
        <div className="toolbar-section">
          <select className="toolbar-dropdown">
            <option>Paragraph</option>
          </select>
          <ChevronDown size={16} />
        </div>
        
        <div className="toolbar-section">
          <button className="toolbar-btn">
            <Bold size={16} />
          </button>
          <button className="toolbar-btn">
            <Italic size={16} />
          </button>
          <button className="toolbar-btn">
            <Link size={16} />
          </button>
          <button className="toolbar-btn">
            <MoreVertical size={16} />
          </button>
        </div>
        
        <div className="toolbar-section">
          <button className="toolbar-btn refine-btn">
            <Sparkles size={16} />
            <span>Refine</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="checklist-content">
        <div className="checklist-main">
          <h1 
            className="checklist-title"
            contentEditable
            suppressContentEditableWarning
            onBlur={handleTitleChange}
            style={{ display: visibilityOptions.title ? 'block' : 'none' }}
          >
            {formData.title}
          </h1>

          {/* Checklist Items */}
          <div className="checklist-items">
            {formData.items.map((item, index) => (
              <div 
                key={item.id} 
                className={`checklist-item ${selectedItem === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedItem(item.id)}
              >
                <button 
                  className="checklist-checkbox"
                  onClick={(e) => handleCheckboxClick(item.id, e)}
                >
                  {item.checked ? (
                    <CheckSquare size={18} />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
                
                <div className="checklist-item-content">
                  <div 
                    className="checklist-item-text"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleUpdateItem(item.id, 'text', e.currentTarget.textContent || '')}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.text}
                  </div>
                </div>
                
                <div className="checklist-item-actions">
                  <button className="checklist-drag-handle">
                    <GripVertical size={14} />
                  </button>
                  <button 
                    className="checklist-item-menu"
                    onClick={(e) => handleItemMenuClick(item.id, e)}
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>

                {/* Item Menu Dropdown */}
                {showItemMenu === item.id && (
                  <div className="checklist-item-menu-dropdown">
                    <div className="menu-option">
                      <CheckCheck size={16} />
                      <span>Sublist</span>
                    </div>
                    <div className="menu-option">
                      <Droplets size={16} />
                      <span>Override color</span>
                    </div>
                    <div className="menu-option" onClick={() => handleDuplicateItem(item.id)}>
                      <Plus size={16} />
                      <span>Duplicate</span>
                    </div>
                    <div className="menu-option delete-option" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <button className="add-item-btn" onClick={handleAddItem}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="checklist-sidebar">
          <button className="sidebar-icon">
            <RotateCcw size={16} />
          </button>
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
              <label className="checklist-visibility-checkbox">
                <input 
                  type="checkbox" 
                  checked={visibilityOptions.title}
                  onChange={(e) => setVisibilityOptions(prev => ({ ...prev, title: e.target.checked }))}
                />
                <span className="checklist-visibility-checkmark"></span>
              </label>
            </div>
            <div className="visibility-option">
              <span className="option-label">Description</span>
              <label className="checklist-visibility-checkbox">
                <input 
                  type="checkbox" 
                  checked={visibilityOptions.description}
                  onChange={(e) => setVisibilityOptions(prev => ({ ...prev, description: e.target.checked }))}
                />
                <span className="checklist-visibility-checkmark"></span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}