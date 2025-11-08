import React from 'react'

const Skeleton = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  ...props
}) => {
  const baseStyles = 'skeleton'
  
  const variants = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  }

  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%'),
  }

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={style}
      {...props}
    />
  )
}

export default Skeleton

