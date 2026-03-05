'use client'

import { ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function GlassPanel({ children, className = '', onClick }: GlassPanelProps) {
  return (
    <div
      className={`backdrop-blur-md bg-white/30 border border-white/30 rounded-2xl shadow-xl ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
