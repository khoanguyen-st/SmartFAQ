import { useState, useRef, useEffect } from 'react'

export interface CheckboxDropdownProps {
  label: string
  required?: boolean
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  error?: boolean
  disabled?: boolean
}

const CheckboxDropdown = ({
  label,
  required = false,
  options,
  selected,
  onChange,
  placeholder = 'Choose option',
  error = false,
  disabled = false
}: CheckboxDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (option: string) => {
    if (disabled) return

    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const displayText = selected.length > 0 ? selected.join(', ') : placeholder

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${error ? 'border-red-500' : 'border-slate-300'} ${disabled ? 'cursor-not-allowed bg-slate-50' : 'bg-white hover:border-slate-400'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
        >
          <span className={selected.length === 0 ? 'text-slate-400' : 'text-slate-900'}>{displayText}</span>
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-300 bg-white shadow-lg">
            {options.map(option => (
              <label key={option} className="flex cursor-pointer items-center px-3 py-2 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => handleToggle(option)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckboxDropdown
