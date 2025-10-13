'use client'

import { useState, useRef, useEffect } from 'react'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface AlignmentDropdownProps {
  currentAlignment: 'left' | 'center' | 'right'
  onAlignmentChange: (alignment: 'left' | 'center' | 'right') => void
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement>
}

export default function AlignmentDropdown({ 
  currentAlignment, 
  onAlignmentChange, 
  isOpen, 
  onClose, 
  triggerRef 
}: AlignmentDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  const alignmentOptions = [
    {
      value: 'left' as const,
      label: 'left',
      icon: AlignLeft,
      lines: [
        { width: '100%', height: '2px' },
        { width: '75%', height: '2px' },
        { width: '50%', height: '2px' }
      ]
    },
    {
      value: 'center' as const,
      label: 'center',
      icon: AlignCenter,
      lines: [
        { width: '60%', height: '2px' },
        { width: '60%', height: '2px' },
        { width: '60%', height: '2px' }
      ]
    },
    {
      value: 'right' as const,
      label: 'right',
      icon: AlignRight,
      lines: [
        { width: '50%', height: '2px', marginLeft: 'auto' },
        { width: '75%', height: '2px', marginLeft: 'auto' },
        { width: '100%', height: '2px', marginLeft: 'auto' }
      ]
    }
  ]

  return (
    <div 
      ref={dropdownRef}
      className="alignment-dropdown"
      style={{
        position: 'absolute',
        top: '50%',
        right: '100%',
        transform: 'translateY(-50%)',
        marginRight: '0.75rem',
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '0.5rem',
        zIndex: 1000,
        minWidth: '120px'
      }}
    >
      {alignmentOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => {
            onAlignmentChange(option.value)
            onClose()
          }}
          className="alignment-option"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: 'none',
            background: currentAlignment === option.value ? '#f3f4f6' : 'transparent',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s',
            color: '#374151',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            if (currentAlignment !== option.value) {
              e.currentTarget.style.background = '#f9fafb'
            }
          }}
          onMouseLeave={(e) => {
            if (currentAlignment !== option.value) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          <div 
            className="alignment-icon"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              width: '20px',
              height: '16px',
              justifyContent: 'center'
            }}
          >
            {option.lines.map((line, index) => (
              <div
                key={index}
                style={{
                  width: line.width,
                  height: line.height,
                  background: '#6b7280',
                  borderRadius: '1px',
                  marginLeft: line.marginLeft || '0'
                }}
              />
            ))}
          </div>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}
