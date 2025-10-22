'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Eye, 
  Droplets,
  Plus,
  Trash2,
  ChevronDown,
  Square,
  Flag,
  RotateCcw,
  Image as ImageIcon,
  List
} from 'lucide-react'
import { FlashcardData } from '@/types'
import './flashcard-editor.css'

interface FlashcardEditorProps {
  data: FlashcardData
  onChange: (data: FlashcardData) => void
}

export default function FlashcardEditor({ data, onChange }: FlashcardEditorProps) {
  const [formData, setFormData] = useState<FlashcardData>({
    title: data.title || 'Untitled',
    description: data.description || 'Add a description',
    cards: data.cards || [
      { id: '1', front: 'Question 1', back: 'Add a description' },
      { id: '2', front: 'Question 2', back: 'Add a description' }
    ]
  })
  
  const [activeCard, setActiveCard] = useState('1')
  const [showDisplayDropdown, setShowDisplayDropdown] = useState(false)
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [displayOptions, setDisplayOptions] = useState<{[key: string]: any}>({})
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [cardImages, setCardImages] = useState<{[key: string]: string}>({})
  
  const displayDropdownRef = useRef<HTMLDivElement>(null)
  const visibilityDropdownRef = useRef<HTMLDivElement>(null)

  // Initialize cardImages from persisted data
  useEffect(() => {
    const initialImages: {[key: string]: string} = {}
    formData.cards.forEach(card => {
      if (card.image) {
        initialImages[card.id] = card.image
      }
    })
    setCardImages(initialImages)
  }, [formData.cards])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (displayDropdownRef.current && !displayDropdownRef.current.contains(event.target as Node)) {
        setShowDisplayDropdown(false)
      }
      if (visibilityDropdownRef.current && !visibilityDropdownRef.current.contains(event.target as Node)) {
        setShowVisibilityDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const updateFormData = (updates: Partial<FlashcardData>) => {
    const newData = { ...formData, ...updates }
    setFormData(newData)
    onChange(newData)
  }

  const updateCard = (cardId: string, updates: Partial<any>) => {
    const updatedCards = formData.cards.map(card => 
      card.id === cardId ? { ...card, ...updates } : card
    )
    updateFormData({ cards: updatedCards })
  }

  const addCard = () => {
    const newCard = {
      id: Date.now().toString(),
      frontTitle: 'Untitled',
      frontDescription: 'Add a description',
      back: 'Add answer here'
    }
    updateFormData({ cards: [...formData.cards, newCard] })
    setActiveCard(newCard.id)
  }

  const flipCard = (cardId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const handleColorPicker = () => {
    alert('Color picker functionality will be implemented here!')
  }

  const handleImageUpload = (cardId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setCardImages(prev => ({
          ...prev,
          [cardId]: imageUrl
        }))
        // Also update the card data to persist the image
        updateCard(cardId, { image: imageUrl })
      }
      reader.readAsDataURL(file)
    }
  }


  const currentCardIndex = formData.cards.findIndex(card => card.id === activeCard)
  const activeCardData = formData.cards.find(card => card.id === activeCard)

  return (
    <div className="flashcard-editor">
      {/* Header Bar */}
      <div className="flashcard-header">
        <div className="header-container">
          <div className="header-left">
            <span className="card-number">CARD {currentCardIndex + 1}</span>
        </div>
        
          <div className="header-center">
          <div className="display-options-container" ref={displayDropdownRef}>
        <button
                className="display-options-btn"
              onClick={() => setShowDisplayDropdown(!showDisplayDropdown)}
            >
                <Eye size={16} />
                Display options
                <ChevronDown size={16} />
        </button>
            
            {showDisplayDropdown && (
              <div className="display-dropdown">
                  <div className="dropdown-section">
                    <h4>CARD DISPLAY OPTIONS</h4>
                    <div className="option-item">
                      <span>Title</span>
                      <label className="checkbox">
                      <input
                        type="checkbox"
                          checked={displayOptions[activeCard]?.title ?? true}
                          onChange={(e) => setDisplayOptions(prev => ({
                            ...prev,
                            [activeCard]: { ...prev[activeCard], title: e.target.checked }
                          }))}
                      />
                      <span className="checkmark"></span>
                    </label>
                </div>
                    <div className="option-item">
                      <span>Description</span>
                      <label className="checkbox">
                      <input
                        type="checkbox"
                          checked={displayOptions[activeCard]?.description ?? true}
                          onChange={(e) => setDisplayOptions(prev => ({
                            ...prev,
                            [activeCard]: { ...prev[activeCard], description: e.target.checked }
                          }))}
                      />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                    <div className="option-item">
                      <span>Background colour</span>
                      <label className="checkbox">
                      <input
                        type="checkbox"
                          checked={displayOptions[activeCard]?.backgroundColour ?? true}
                          onChange={(e) => setDisplayOptions(prev => ({
                            ...prev,
                            [activeCard]: { ...prev[activeCard], backgroundColour: e.target.checked }
                          }))}
                      />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                      <div className="option-item">
                        <span>Image</span>
                        <label className="checkbox">
                      <input
                        type="checkbox"
                            checked={displayOptions[activeCard]?.image ?? true}
                            onChange={(e) => setDisplayOptions(prev => ({
                              ...prev,
                              [activeCard]: { ...prev[activeCard], image: e.target.checked }
                            }))}
                      />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

          <div className="header-separator"></div>
        
          <div className="header-right">
            <button className="header-icon-btn" title="Color" onClick={handleColorPicker}>
            <Droplets size={16} />
          </button>
            <button className="header-icon-btn" title="Add">
              <Square size={16} />
          </button>
            <button className="header-icon-btn" title="Delete">
            <Trash2 size={16} />
        </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flashcard-content">
        {/* Title Section */}
        <div className="flashcard-title-section">
            <input
              type="text"
            className="flashcard-title"
              value={formData.title || ''}
              onChange={(e) => updateFormData({ title: e.target.value })}
              placeholder="Untitled"
            />
          <div
            className="flashcard-description"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateFormData({ description: e.currentTarget.textContent || '' })}
          >
            {formData.description || ''}
          </div>
        </div>

        {/* Cards Container */}
        <div className="flashcard-cards-container">
          {formData.cards.map((card, index) => (
            <div 
              key={card.id} 
              className={`flashcard-card ${activeCard === card.id ? 'active' : ''} ${flippedCards.has(card.id) ? 'flipped' : ''}`}
              style={{
                backgroundColor: displayOptions[card.id]?.backgroundColour === false ? 'white' : '#3b82f6'
              }}
              onClick={() => setActiveCard(card.id)}
                >
                  <div className="card-content">
                <div className="card-front">
                  {displayOptions[card.id]?.image !== false && (
                    <div className="card-image-container">
                      {(cardImages[card.id] || card.image) ? (
                        <img 
                          src={cardImages[card.id] || card.image} 
                          alt="Card image" 
                          className="card-image"
                        />
                      ) : (
                        <div className="card-image-placeholder">
                          <ImageIcon size={24} />
                          <span>Add an image</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="card-image-input"
                        onChange={(e) => handleImageUpload(card.id, e)}
                        style={{ display: flippedCards.has(card.id) ? 'none' : 'block' }}
                      />
                      </div>
                  )}
                  <div className="card-text">
                    {displayOptions[card.id]?.title !== false && (
                    <input
                      type="text"
                      className="card-title"
                      value={card.frontTitle || ''}
                      onChange={(e) => updateCard(card.id, { frontTitle: e.target.value })}
                      placeholder="Card title"
                    />
                    )}
                    {displayOptions[card.id]?.description !== false && (
                      <div
                        className="card-description"
                          contentEditable
                          suppressContentEditableWarning
                        onBlur={(e) => updateCard(card.id, { frontDescription: e.currentTarget.textContent || '' })}
                        >
                        {card.frontDescription || ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-back">
                      <div className="card-text">
                    <div
                      className="card-answer"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateCard(card.id, { back: e.currentTarget.textContent || '' })}
                    >
                      {card.back || ''}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card-footer">
                <button
                  className="flip-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                    flipCard(card.id)
                    }}
                  >
                  <RotateCcw size={16} />
                </button>
              </div>
                    </div>
          ))}
          
          {/* Completion Card - Always at the end */}
          <div className="completion-card">
            <div className="completion-content">
              <h2 className="completion-title">All done!</h2>
              <p className="completion-text">Continue to the next screen</p>
              <div className="completion-actions">
                <button className="completion-btn refresh-btn">
                  <RotateCcw size={20} />
                </button>
                <button className="completion-btn continue-btn">
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="flashcard-sidebar">
        <div className="sidebar-icon" onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}>
          <List size={20} />
        </div>
          
          {showVisibilityDropdown && (
          <div className="visibility-dropdown" ref={visibilityDropdownRef}>
            <div className="dropdown-section">
              <h4>Visibility Options</h4>
              <div className="option-item">
                <span>Show all cards</span>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              </div>
            </div>
          )}

        <div className="sidebar-icon" onClick={() => setShowColorPicker(!showColorPicker)}>
          <Eye size={20} />
        </div>
        
        <div className="sidebar-icon">
          <Droplets size={20} />
        </div>
      </div>

      {/* Card Footer Navigation */}
      <div className="card-footer-nav">
        <div className="nav-cards">
          {formData.cards.map((card, index) => (
            <button
              key={card.id}
              className={`nav-card-btn ${activeCard === card.id ? 'active' : ''}`}
              onClick={() => setActiveCard(card.id)}
            >
              {index + 1}
            </button>
          ))}
          <button className="nav-card-btn flag-btn">
            <Flag size={16} />
          </button>
        </div>
        
        <button className="add-card-btn" onClick={addCard}>
          <Plus size={16} />
          Add card
        </button>
      </div>
    </div>
  )
}
