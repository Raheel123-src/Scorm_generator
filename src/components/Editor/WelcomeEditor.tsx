'use client'

import { useState } from 'react'
import { Clock, FileText, Edit3 } from 'lucide-react'
import { WelcomeData } from '@/types'

interface WelcomeEditorProps {
  data: WelcomeData
  onChange: (data: WelcomeData) => void
}

export default function WelcomeEditor({ data, onChange }: WelcomeEditorProps) {
  const [formData, setFormData] = useState<WelcomeData>({
    title: data.title || '',
    description: data.description || '',
    duration: data.duration || 0
  })

  const handleChange = (field: keyof WelcomeData, value: string | number) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChange(newData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Welcome Page Editor</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Title
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Enter course title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            className="input-field"
            placeholder="Enter course description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Duration (minutes)
          </label>
          <input
            type="number"
            min="0"
            className="input-field"
            placeholder="Enter course duration"
            value={formData.duration}
            onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
        <div className="bg-white p-4 rounded border">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {formData.title || 'Course Title'}
          </h2>
          <p className="text-gray-600 mb-3">
            {formData.description || 'Course description will appear here...'}
          </p>
          {formData.duration > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              Duration: {formData.duration} minutes
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
