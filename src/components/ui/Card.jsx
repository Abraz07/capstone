import React from 'react'

const Card = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  ...props
}) => {
  const baseStyles = variant === 'gradient' ? 'card-gradient' : 'card'
  const interactiveStyles = onClick ? 'cursor-pointer hover:scale-[1.02] transition-all duration-300' : ''

  return (
    <div
      className={`${baseStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
)

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold text-calm-900 dark:text-calm-50 ${className}`}>
    {children}
  </h3>
)

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-calm-600 dark:text-calm-400 mt-1 ${className}`}>
    {children}
  </p>
)

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
)

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-calm-200 dark:border-calm-700 ${className}`}>
    {children}
  </div>
)

export default Card

