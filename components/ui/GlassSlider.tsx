'use client'

interface GlassSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}

export function GlassSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  label,
}: GlassSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex justify-between text-sm text-white/90">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer
          bg-white/20 accent-sage-400"
        style={{
          background: `linear-gradient(to right, rgba(98, 142, 85, 0.8) ${value}%, rgba(255,255,255,0.2) ${value}%)`,
        }}
      />
    </div>
  )
}
