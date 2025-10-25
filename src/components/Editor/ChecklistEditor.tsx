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
    items: (data.items || []).map(item => ({ ...item, checked: true }))
  })
  
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null)
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [visibilityOptions, setVisibilityOptions] = useState({
    title: true,
    description: true
  })
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

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
      checked: true
    }
    const updatedData = { ...formData, items: [...formData.items, newItem] }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const updateItemInNestedStructure = (items: any[], id: string, field: 'text' | 'checked', value: string | boolean): any[] => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value }
      }
      if (item.children) {
        return {
          ...item,
          children: updateItemInNestedStructure(item.children, id, field, value)
        }
      }
      return item
    })
  }

  const handleUpdateItem = (id: string, field: 'text' | 'checked', value: string | boolean) => {
    const updatedData = {
      ...formData,
      items: updateItemInNestedStructure(formData.items, id, field, value)
    }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const deleteItemFromNestedStructure = (items: any[], id: string): any[] => {
    return items.filter(item => {
      if (item.id === id) {
        return false
      }
      if (item.children) {
        return {
          ...item,
          children: deleteItemFromNestedStructure(item.children, id)
        }
      }
      return true
    }).map(item => {
      if (item.children) {
        return {
          ...item,
          children: deleteItemFromNestedStructure(item.children, id)
        }
      }
      return item
    })
  }

  const handleDeleteItem = (id: string) => {
    const updatedData = {
      ...formData,
      items: deleteItemFromNestedStructure(formData.items, id)
    }
    setFormData(updatedData)
    onChange(updatedData)
    setShowItemMenu(null)
  }

  const handleCreateSublist = (id: string) => {
    const parentItem = formData.items.find(item => item.id === id)
    if (parentItem) {
      const newSublistItem = {
        id: `sublist-${Date.now()}`,
        text: 'New sublist item',
        checked: true,
        parentId: id
      }
      
      // Find the parent item and add the sublist item to its children
      const updatedItems = formData.items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            children: [...(item.children || []), newSublistItem]
          }
        }
        return item
      })
      
      const updatedData = { ...formData, items: updatedItems }
      setFormData(updatedData)
      onChange(updatedData)
    }
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

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '1'
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItem(itemId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetItemId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const draggedIndex = formData.items.findIndex(item => item.id === draggedItem)
    const targetIndex = formData.items.findIndex(item => item.id === targetItemId)
    
    if (draggedIndex === -1 || targetIndex === -1) return

    const newItems = [...formData.items]
    const [draggedItemData] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, draggedItemData)

    const updatedData = { ...formData, items: newItems }
    setFormData(updatedData)
    onChange(updatedData)
    
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const renderChecklistItem = (item: any, isChild: boolean = false) => {
    return (
      <div key={item.id}>
        <div 
          className={`checklist-item ${isChild ? 'sublist-item' : ''} ${selectedItem === item.id ? 'selected' : ''} ${draggedItem === item.id ? 'dragging' : ''} ${dragOverItem === item.id ? 'drag-over' : ''}`}
          onClick={() => setSelectedItem(item.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
        >
          <button 
            className={`checklist-checkbox ${item.checked ? 'checked' : 'unchecked'}`}
            onClick={(e) => handleCheckboxClick(item.id, e)}
          >
            {item.checked ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L4.5 8.5L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : null}
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
            <button 
              className="checklist-drag-handle"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical size={18} />
            </button>
            <button 
              className="checklist-item-menu"
              onClick={(e) => handleItemMenuClick(item.id, e)}
            >
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Item Menu Dropdown */}
          {showItemMenu === item.id && (
            <div className="checklist-item-menu-dropdown">
              <div className="menu-option" onClick={() => handleCreateSublist(item.id)}>
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
        
        {/* Render children if they exist */}
        {item.children && item.children.length > 0 && (
          <div className="sublist-container">
            {item.children.map((child: any) => renderChecklistItem(child, true))}
          </div>
        )}
      </div>
    )
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
            {formData.items.map((item, index) => renderChecklistItem(item))}
            
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