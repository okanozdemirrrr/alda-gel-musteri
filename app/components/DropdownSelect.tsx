'use client'

import { useState, useRef, useEffect } from 'react'

interface DropdownOption {
  value: string
  label: string
}

interface DropdownSelectProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  disabled?: boolean
  required?: boolean
}

export default function DropdownSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled = false,
  required = false
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Klavye navigasyonu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else if (options[highlightedIndex]) {
          handleSelect(options[highlightedIndex].value)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : prev
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setIsOpen(false)
    setHighlightedIndex(0)
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  // Highlighted item'ı scroll ile görünür yap
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [highlightedIndex, isOpen])

  // Seçili öğenin label'ını bul
  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder

  return (
    <div className="relative">
      <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
        {label}
      </label>
      
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full h-[48px] px-4 pr-10 bg-white border rounded-lg text-[14px] text-left focus:outline-none transition-all ${
          disabled 
            ? 'border-[#e8e8e8] bg-[#f7f7f7] text-[#9e9e9e] cursor-not-allowed' 
            : isOpen
            ? 'border-[#f59e0b] shadow-md'
            : 'border-[#e8e8e8] hover:border-[#f59e0b] focus:border-[#f59e0b]'
        } ${!value ? 'text-[#9e9e9e]' : 'text-[#3c4043]'}`}
        style={{ fontFamily: 'Open Sans, sans-serif' }}
      >
        {selectedLabel}
      </button>

      {/* Dropdown ikon */}
      <div className="absolute right-3 top-[38px] pointer-events-none">
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={disabled ? '#9e9e9e' : isOpen ? '#f59e0b' : '#6f6f6f'} 
          strokeWidth="2"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {/* Dropdown menü */}
      {isOpen && options.length > 0 && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-[#e8e8e8] rounded-lg shadow-xl max-h-[280px] overflow-y-auto animate-fadeIn"
          style={{
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-4 py-3 cursor-pointer transition-all duration-150 ${
                index === highlightedIndex
                  ? 'bg-[#fef3c7] border-l-4 border-[#f59e0b] pl-[14px]'
                  : value === option.value
                  ? 'bg-[#f7f7f7] border-l-4 border-transparent'
                  : 'hover:bg-[#f7f7f7] border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span 
                  className={`text-[14px] font-medium transition-colors ${
                    index === highlightedIndex 
                      ? 'text-[#f59e0b]' 
                      : 'text-[#3c4043]'
                  }`}
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                >
                  {option.label}
                </span>
                {value === option.value && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seçenek yok mesajı */}
      {isOpen && options.length === 0 && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#e8e8e8] rounded-lg shadow-lg p-4">
          <p className="text-[13px] text-[#9e9e9e] text-center">
            Seçenek bulunamadı
          </p>
        </div>
      )}
    </div>
  )
}

