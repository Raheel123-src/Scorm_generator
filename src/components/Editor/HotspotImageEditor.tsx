'use client'

import { useState } from 'react'
import { HotspotImageData } from '@/types'
import '../../app/editor/new/hotspot-image-editor.css'

interface HotspotImageEditorProps {
  data: HotspotImageData
  onChange: (data: HotspotImageData) => void
}

const HotspotImageEditor = ({ data, onChange }: HotspotImageEditorProps) => {
  const [formData, setFormData] = useState<HotspotImageData>(data)

  const updateFormData = (updates: Partial<HotspotImageData>) => {
    const newData = { ...formData, ...updates }
    setFormData(newData)
    onChange(newData)
  }

  return (
    <div className="hotspot-image-editor">
      <div className="editor-header">
        <h2>Hotspot Image Editor</h2>
        <p>Add hotspots to your image</p>
      </div>
      
      <div className="editor-content">
        <div className="image-container">
          {formData.imageUrl ? (
            <img 
              src={formData.imageUrl} 
              alt={formData.altText} 
              className="main-image"
            />
          ) : (
            <div className="image-placeholder">
              <p>No image uploaded</p>
            </div>
          )}
        </div>
        
        <div className="editor-controls">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              placeholder="Enter title"
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Enter description"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HotspotImageEditor