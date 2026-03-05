'use client'

import { useState } from 'react'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassPanel } from '@/components/ui/GlassPanel'
import type { AvatarChoice } from '@/lib/types'

interface AvatarSelectorProps {
  onSelect: (avatar: AvatarChoice) => void
  current?: AvatarChoice
}

const AVATARS: Array<{
  key: AvatarChoice
  label: string
  emoji: string
  description: string
  locked?: boolean
}> = [
  { key: 'farmer_girl', label: 'Farmer Rose', emoji: '👩‍🌾', description: 'Thoughtful and nurturing' },
  { key: 'farmer_boy', label: 'Farmer Sol', emoji: '👨‍🌾', description: 'Calm and steady' },
  { key: 'cow', label: 'Clovis the Cow', emoji: '🐄', description: 'Playful and curious' },
]

export function AvatarSelector({ onSelect, current = 'farmer_girl' }: AvatarSelectorProps) {
  const [selected, setSelected] = useState<AvatarChoice>(current)

  return (
    <div className="space-y-5">
      <p className="text-white/80 text-sm text-center">
        Who will tend your mindful farm?
      </p>

      <div className="grid grid-cols-3 gap-3">
        {AVATARS.map((a) => (
          <button
            key={a.key}
            onClick={() => !a.locked && setSelected(a.key)}
            disabled={a.locked}
            className={`
              relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all
              ${a.locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              ${selected === a.key
                ? 'border-white/60 bg-white/30 scale-105 shadow-lg'
                : 'border-white/20 bg-white/10 hover:bg-white/20'
              }
            `}
          >
            {a.locked && (
              <span className="absolute top-2 right-2 text-xs">🔒</span>
            )}
            <span className="text-4xl mb-2">{a.emoji}</span>
            <span className="text-white text-xs font-bold">{a.label}</span>
            <span className="text-white/60 text-xs mt-0.5 text-center">{a.description}</span>
          </button>
        ))}
      </div>

      <GlassPanel className="p-3 text-center">
        <p className="text-white/70 text-xs">
          Selected: <span className="text-white font-medium">
            {AVATARS.find((a) => a.key === selected)?.label}
          </span>
        </p>
      </GlassPanel>

      <GlassButton
        className="w-full"
        onClick={() => onSelect(selected)}
      >
        Enter the Farm
      </GlassButton>
    </div>
  )
}
