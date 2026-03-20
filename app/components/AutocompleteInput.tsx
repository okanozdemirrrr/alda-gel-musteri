'use client'

import { useState, useRef, useEffect } from 'react'

interface AutocompleteOption {
  value: string
  label: string
  subtitle?: string
}

interface AutocompleteInputProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: AutocompleteOption[]
  disabled?: boolean
  required?: boolean
  onFocus?: () => void
}

export default function AutocompleteInput({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  onFocus
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Klavye navigasyonu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || options.length === 0) {
      if (e.key === 'ArrowDown' && options.length > 0) {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (options[highlightedIndex]) {
          handleSelect(options[highlightedIndex].value)
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setIsOpen(false)
    setHighlightedIndex(0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
    setHighlightedIndex(0)
  }

  const handleInputFocus = () => {
    if (onFocus) onFocus()
    // Focus olduğunda, eğer değer boşsa ve seçenekler varsa tümünü göster
    if (options.length > 0) {
      setIsOpen(true)
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

  return (
    <div className="relative">
      <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
        {label}
      </label>
      
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        required={required}
        className={`w-full h-[48px] px-4 pr-12 bg-white border rounded-lg text-[14px] focus:outline-none transition-all ${
          disabled 
            ? 'border-[#e8e8e8] bg-[#f7f7f7] text-[#9e9e9e] cursor-not-allowed' 
            : isOpen && options.length > 0
            ? 'border-[#f59e0b] shadow-md'
            : 'border-[#e8e8e8] focus:border-[#f59e0b]'
        }`}
        style={{ fontFamily: 'Open Sans, sans-serif' }}
        autoComplete="off"
      />

      {/* İkon göstergesi */}
      {!disabled && (
        <div className="absolute right-3 top-[38px] flex items-center gap-1">
          {/* Temizle butonu */}
          {value.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
                inputRef.current?.focus()
              }}
              className="p-1 hover:bg-[#f7f7f7] rounded-full transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
          
          {/* Durum ikonu */}
          {isOpen && options.length > 0 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          ) : value.length > 0 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && options.length > 0 && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-[#e8e8e8] rounded-lg shadow-xl max-h-[240px] overflow-y-auto animate-fadeIn"
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
                  : 'hover:bg-[#f7f7f7] border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span 
                  className={`text-[14px] font-medium transition-colors ${
                    index === highlightedIndex ? 'text-[#f59e0b]' : 'text-[#3c4043]'
                  }`}
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                >
                  {option.label}
                </span>
                {option.subtitle && (
                  <span className={`text-[12px] px-2 py-1 rounded ${
                    index === highlightedIndex 
                      ? 'bg-[#f59e0b] text-white' 
                      : 'bg-[#f7f7f7] text-[#9e9e9e]'
                  }`}>
                    {option.subtitle}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sonuç bulunamadı mesajı */}
      {isOpen && options.length === 0 && value.length > 0 && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#e8e8e8] rounded-lg shadow-lg p-4">
          <p className="text-[13px] text-[#9e9e9e] text-center">
            Sonuç bulunamadı
          </p>
        </div>
      )}
    </div>
  )
}

