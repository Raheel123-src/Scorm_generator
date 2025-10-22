'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Eye, 
  Droplets,
  CheckSquare,
  RotateCcw,
  Heart,
  Clock,
  Send,
  FileText,
  Download
} from 'lucide-react'
import { DocumentData } from '@/types'
import '../../app/editor/new/document-editor.css'

// Dynamic import for mammoth.js
let mammoth: any = null
const loadMammoth = async () => {
  if (!mammoth) {
    mammoth = await import('mammoth')
  }
  return mammoth
}

interface DocumentEditorProps {
  data: DocumentData
  onChange: (data: DocumentData) => void
}

export default function DocumentEditor({ data, onChange }: DocumentEditorProps) {
  const [formData, setFormData] = useState<DocumentData>({
    title: data.title || 'Untitled',
    documentUrl: data.documentUrl || '',
    enforceCompletion: data.enforceCompletion || false,
    description: data.description || '',
    fileName: data.fileName,
    fileType: data.fileType,
    docxContent: data.docxContent
  })
  const [docxContent, setDocxContent] = useState<string>(data.docxContent || '')
  const [isLoadingDocx, setIsLoadingDocx] = useState(false)
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [visibilityOptions, setVisibilityOptions] = useState({
    title: true,
    description: true
  })
  const visibilityRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const handleChange = (field: keyof DocumentData, value: string | boolean) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChange(newData)
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      
      // Update formData with file info first
      const updatedData = { 
        ...formData, 
        documentUrl: url,
        fileName: file.name, 
        fileType: file.type 
      }
      setFormData(updatedData)
      
      // Parse DOCX files for preview
      console.log('File type:', file.type, 'File name:', file.name)
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          file.type === 'application/msword') {
        console.log('Parsing DOCX file...')
        await parseDocxFile(file, updatedData)
      } else {
        // For non-DOCX files, update parent immediately
        onChange(updatedData)
      }
    }
  }

  const parseDocxFile = async (file: File, baseData: DocumentData) => {
    try {
      setIsLoadingDocx(true)
      const mammothLib = await loadMammoth()
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammothLib.convertToHtml({ arrayBuffer })
      const htmlContent = result.value
      setDocxContent(htmlContent)
      
      // Save to formData and persist
      const newData = { ...baseData, docxContent: htmlContent }
      setFormData(newData)
      
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        onChange(newData)
      }, 0)
    } catch (error) {
      console.error('Error parsing DOCX:', error)
      const errorContent = '<p>Error loading document content</p>'
      setDocxContent(errorContent)
      
      // Save error state to formData
      const newData = { ...baseData, docxContent: errorContent }
      setFormData(newData)
      
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        onChange(newData)
      }, 0)
    } finally {
      setIsLoadingDocx(false)
    }
  }

  // Function to check if file can be previewed directly
  const canPreviewDirectly = (fileType: string) => {
    return fileType === 'application/pdf' || 
           fileType === 'text/plain' || 
           fileType === 'text/rtf'
  }

  // Function to get the appropriate viewer URL for different file types
  const getViewerUrl = (fileUrl: string, fileType: string) => {
    if (fileType === 'application/pdf') {
      return fileUrl // PDF can be viewed directly
    } else if (fileType === 'text/plain' || fileType === 'text/rtf') {
      // For text files, we can display them directly
      return fileUrl
    }
    // For DOCX/PPTX files, we'll show a preview card instead of trying online viewers
    return fileUrl
  }

  // Function to check if file can be previewed with online viewer
  const canPreviewWithViewer = (fileType: string) => {
    const canPreview = fileType === 'application/pdf' || 
           fileType === 'text/plain' || 
           fileType === 'text/rtf' ||
           (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && docxContent) ||
           (fileType === 'application/msword' && docxContent)
    
    console.log('canPreviewWithViewer:', {
      fileType,
      docxContent: !!docxContent,
      canPreview
    })
    
    return canPreview
  }

  // Restore DOCX content when component mounts
  useEffect(() => {
    if (data.docxContent && !docxContent) {
      setDocxContent(data.docxContent)
    }
  }, [data.docxContent, docxContent])

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
    <div className="document-editor">
      {/* Top Section */}
      <div className="document-editor-header">
        <div className="document-controls">
          <button 
            className={`enforce-completion-btn ${formData.enforceCompletion ? 'active' : ''}`}
            onClick={() => handleChange('enforceCompletion', !formData.enforceCompletion)}
          >
            <CheckSquare size={16} />
            {formData.enforceCompletion ? 'Enforce completion' : 'Allow skip'}
          </button>
          <button className="replace-document-btn" onClick={() => document.getElementById('document-upload')?.click()}>
            <RotateCcw size={16} />
            Replace document
          </button>
        </div>
      </div>

      {/* Hidden document upload input - always available */}
      <input
        id="document-upload"
        type="file"
        accept=".pdf,.doc,.docx,.txt,.rtf,.ppt,.pptx"
        onChange={handleDocumentUpload}
        style={{ display: 'none' }}
      />

      {/* Document Viewer Section */}
      <div className="document-viewer-container">
        {/* Document Title */}
        {visibilityOptions.title && (
          <div className="document-title-section">
            <h1 
              contentEditable
              suppressContentEditableWarning
              className="document-title"
              onBlur={(e) => handleChange('title', e.currentTarget.textContent || '')}
            >
              {formData.title}
            </h1>
          </div>
        )}
        
        {/* Document Description */}
        {visibilityOptions.description && (
          <div className="document-description-section">
            <div 
              contentEditable
              suppressContentEditableWarning
              className="document-description"
              onBlur={(e) => handleChange('description', e.currentTarget.textContent || '')}
            >
              {formData.description || 'Add a description for your document...'}
            </div>
          </div>
        )}
        
        <div className="document-viewer-wrapper">
          <div className="document-viewer">
            {formData.documentUrl ? (
              // Check if file can be previewed with viewer (PDF, DOCX, PPTX, TXT) or needs download only
              canPreviewWithViewer(formData.fileType || '') ? (
                <div className="document-preview">
                  {isLoadingDocx ? (
                    <div className="document-loading">
                      <div className="loading-spinner"></div>
                      <p>Loading document...</p>
                    </div>
                  ) : (formData.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                       formData.fileType === 'application/msword') && docxContent ? (
                    <div className="docx-content">
                      <div 
                        className="docx-html-content"
                        dangerouslySetInnerHTML={{ __html: docxContent }}
                      />
                    </div>
                  ) : (
                    <iframe 
                      src={getViewerUrl(formData.documentUrl, formData.fileType || '')}
                      className="document-iframe"
                      title="Document Preview"
                    />
                  )}
                  <div className="document-overlay">
                    <div className="document-actions">
                      <a 
                        href={formData.documentUrl} 
                        download={formData.fileName}
                        className="document-action-btn" 
                        title="Download"
                      >
                        <Download size={20} />
                      </a>
                      <button className="document-action-btn" title="Full Screen">
                        <FileText size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Enhanced preview for DOCX, PPTX, and other files
                <div className="document-download-preview">
                  <div className="document-info">
                    <div className="document-key-badge">
                      {formData.fileType?.includes('word') ? 'WORD DOCUMENT' :
                       formData.fileType?.includes('presentation') ? 'PRESENTATION' :
                       formData.fileType?.includes('spreadsheet') ? 'SPREADSHEET' :
                       'DOCUMENT'}
                    </div>
                    <div className="document-filename">{formData.fileName || 'Document'}</div>
                    <div className="document-actions">
                      <a 
                        href={formData.documentUrl} 
                        download={formData.fileName}
                        className="download-link"
                        title="Download Document"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                  </div>
                  <div className="document-preview-note">
                    <p>📄 Document uploaded successfully</p>
                    <p>Click download to view the full document</p>
                    <p className="preview-hint">💡 Tip: Open with Microsoft Word, PowerPoint, or Google Docs for full editing</p>
                  </div>
                </div>
              )
            ) : (
              <div className="document-placeholder">
                <div className="document-upload-area">
                  <div className="upload-content">
                    <div className="upload-icon">📄</div>
                    <h3>Upload Document</h3>
                    <p>Click to select a document file (PDF, DOC, DOCX, TXT, RTF, PPT, PPTX)</p>
                    <button 
                      className="upload-btn"
                      onClick={() => document.getElementById('document-upload')?.click()}
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Side Icons */}
            <div className="document-side-icons">
              <button className="side-icon" title="Like">
                <Heart size={20} />
              </button>
              <button className="side-icon" title="Bookmark">
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
      <div className="document-sidebar">
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
