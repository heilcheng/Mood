'use client'

interface GlassToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
}

export function GlassToggle({ checked, onChange, label }: GlassToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      {label && <span className="text-white/90 text-sm font-medium">{label}</span>}
      <div
        className={`
          relative w-11 h-6 rounded-full transition-colors duration-200
          ${checked ? 'bg-sage-400/80' : 'bg-white/20'}
          border border-white/30
        `}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white shadow
            transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0.5'}
          `}
        />
      </div>
    </label>
  )
}
