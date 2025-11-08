import React from 'react'
import { Loader2 } from 'lucide-react'

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'font-medium rounded-xl focus-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 hover:from-primary-700 hover:via-primary-600 hover:to-indigo-700 text-white shadow-elegant hover:shadow-elegant-lg transform hover:scale-105 active:scale-95 transition-all duration-300 relative overflow-hidden group',
    secondary: 'bg-gradient-to-r from-calm-200 to-calm-100 dark:from-calm-700 dark:to-calm-600 hover:from-calm-300 hover:to-calm-200 dark:hover:from-calm-600 dark:hover:to-calm-500 text-calm-900 dark:text-calm-50 shadow-md hover:shadow-lg transform hover:scale-105',
    outline: 'border-2 border-primary-500/60 text-primary-600 dark:text-primary-400 hover:bg-gradient-to-r hover:from-primary-50/80 hover:to-indigo-50/80 dark:hover:from-primary-900/30 dark:hover:to-indigo-900/30 shadow-sm hover:shadow-md hover:border-primary-500 transform hover:scale-105',
    ghost: 'hover:bg-calm-100/80 dark:hover:bg-calm-800/80 text-calm-900 dark:text-calm-50 backdrop-blur-sm transform hover:scale-105',
    danger: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-700 hover:via-rose-700 hover:to-red-600 text-white shadow-elegant hover:shadow-elegant-lg transform hover:scale-105',
  }
  
  const sizes = {
    small: 'px-4 py-2 text-sm min-h-[40px]',
    medium: 'px-5 py-3 text-base min-h-[48px]',
    large: 'px-6 py-4 text-lg min-h-[56px]',
  }

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default Button

