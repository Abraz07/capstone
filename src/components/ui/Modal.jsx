import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  className = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`bg-white/95 dark:bg-calm-800/95 backdrop-blur-2xl rounded-3xl shadow-elegant-lg border border-calm-200/50 dark:border-calm-700/50 ${sizes[size]} w-full ${className} animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between p-6 border-b border-calm-200/60 dark:border-calm-700/60 bg-gradient-to-r from-primary-50/30 to-indigo-50/30 dark:from-primary-900/20 dark:to-indigo-900/20">
            {title && (
              <h2 id="modal-title" className="text-2xl font-bold gradient-text">
                {title}
              </h2>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-calm-100 dark:hover:bg-calm-700 focus-ring"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        <div className="p-8">{children}</div>
        
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-calm-200/60 dark:border-calm-700/60 bg-gradient-to-r from-calm-50/50 to-primary-50/30 dark:from-calm-800/50 dark:to-primary-900/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal

