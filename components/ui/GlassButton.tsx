'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles = {
  primary: 'bg-sage-400/60 hover:bg-sage-400/80 border-sage-300/50 text-white',
  secondary: 'bg-white/20 hover:bg-white/30 border-white/30 text-white',
  danger: 'bg-blush-400/60 hover:bg-blush-400/80 border-blush-300/50 text-white',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-4 text-lg',
}

export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={`
        backdrop-blur-md border rounded-xl font-semibold font-sans
        transition-all duration-200 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-md hover:shadow-lg
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
