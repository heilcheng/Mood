'use client'

import { useState } from 'react'
import { GlassModal } from '@/components/ui/GlassModal'
import { GlassToggle } from '@/components/ui/GlassToggle'
import { GlassSlider } from '@/components/ui/GlassSlider'
import { GlassButton } from '@/components/ui/GlassButton'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [musicVolume, setMusicVolume] = useState(70)
  const [sfxVolume, setSfxVolume] = useState(80)
  const [ambientVolume, setAmbientVolume] = useState(60)
  const [pixelArt, setPixelArt] = useState(true)
  const [showHints, setShowHints] = useState(true)

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-5">
        <div className="space-y-4">
          <p className="text-white/60 text-xs uppercase tracking-wide font-medium">Audio</p>
          <GlassSlider value={musicVolume} onChange={setMusicVolume} label="Music Volume" />
          <GlassSlider value={sfxVolume} onChange={setSfxVolume} label="Sound Effects" />
          <GlassSlider value={ambientVolume} onChange={setAmbientVolume} label="Ambient Sounds" />
        </div>

        <div className="border-t border-white/10 pt-4 space-y-3">
          <p className="text-white/60 text-xs uppercase tracking-wide font-medium">Display</p>
          <GlassToggle checked={pixelArt} onChange={setPixelArt} label="Pixel Art Mode" />
          <GlassToggle checked={showHints} onChange={setShowHints} label="Show Interaction Hints" />
        </div>

        <div className="flex justify-end gap-3">
          <GlassButton variant="secondary" onClick={onClose} size="sm">Cancel</GlassButton>
          <GlassButton onClick={onClose} size="sm">Save</GlassButton>
        </div>
      </div>
    </GlassModal>
  )
}
