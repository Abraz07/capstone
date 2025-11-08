import React from 'react'

const Badge = ({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full'
  
  const variants = {
    default: 'bg-calm-200 dark:bg-calm-700 text-calm-900 dark:text-calm-50',
    primary: 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200',
    success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    warning: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  }
  
  const sizes = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-1.5 text-base',
  }

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge

