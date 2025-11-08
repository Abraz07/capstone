import React from 'react'

const Toggle = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  ...props
}) => {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="flex items-center gap-3">
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? `${toggleId}-label` : undefined}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-primary-600' : 'bg-calm-300 dark:bg-calm-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus-ring
        `}
        {...props}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      {label && (
        <label
          id={`${toggleId}-label`}
          htmlFor={toggleId}
          className={`text-sm font-medium text-calm-700 dark:text-calm-300 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
        >
          {label}
        </label>
      )}
    </div>
  )
}

export default Toggle

