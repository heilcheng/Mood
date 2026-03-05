'use client'

import { useState } from 'react'
import { GlassModal } from '@/components/ui/GlassModal'
import { GlassToggle } from '@/components/ui/GlassToggle'
import { GlassSlider } from '@/components/ui/GlassSlider'
import { GlassButton } from '@/components/ui/GlassButton'
import { useGameStore } from '@/lib/gameStore'
import { AudioManager } from '@/lib/audioManager'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const PROMPT_STYLES = [
  { value: 'gentle', label: 'Gentle', desc: 'Soft, nurturing prompts' },
  { value: 'exploratory', label: 'Exploratory', desc: 'Curious, open-ended prompts' },
  { value: 'creative', label: 'Creative', desc: 'Imaginative, expressive prompts' },
] as const

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { userSettings, updateUserSettings, displayName, avatar } = useGameStore()

  const [nameInput, setNameInput] = useState(userSettings.displayName ?? displayName ?? '')
  const [promptStyle, setPromptStyle] = useState(userSettings.journalPromptStyle)
  const [pixelArt, setPixelArt] = useState(true)
  const [showHints, setShowHints] = useState(true)

  const handleMusicVolume = (v: number) => {
    updateUserSettings({ musicVolume: v })
    AudioManager.setMusicVolume(v)
  }

  const handleSfxVolume = (v: number) => {
    updateUserSettings({ sfxVolume: v })
    AudioManager.setSfxVolume(v)
    AudioManager.playSfx('click')
  }

  const handleSave = () => {
    updateUserSettings({
      displayName: nameInput.trim() || null,
      journalPromptStyle: promptStyle,
    })
    onClose()
  }

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-5">

        {/* Profile section */}
        <div className="space-y-3">
          <p className="text-white/60 text-xs uppercase tracking-wide font-medium">Profile</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-2xl flex-shrink-0">
              {avatar === 'farmer_girl' ? '👩‍🌾' : avatar === 'farmer_boy' ? '👨‍🌾' : '🐄'}
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your display name"
              maxLength={30}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2
                text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40"
            />
          </div>
        </div>

        {/* Well-being section */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <p className="text-white/60 text-xs uppercase tracking-wide font-medium">Well-being</p>
          <p className="text-white/50 text-xs">Journal prompt style</p>
          <div className="flex flex-col gap-2">
            {PROMPT_STYLES.map((style) => (
              <label
                key={style.value}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  promptStyle === style.value
                    ? 'bg-white/20 border-white/40'
                    : 'bg-white/8 border-white/15 hover:bg-white/15'
                }`}
              >
                <input
                  type="radio"
                  name="promptStyle"
                  value={style.value}
                  checked={promptStyle === style.value}
                  onChange={() => setPromptStyle(style.value)}
                  className="accent-white"
                />
                <div>
                  <p className="text-white text-sm font-medium">{style.label}</p>
                  <p className="text-white/50 text-xs">{style.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Audio section */}
        <div className="border-t border-white/10 pt-4 space-y-4">
          <p className="text-white/60 text-xs uppercase tracking-wide font-medium">Audio</p>
          <GlassSlider
            value={userSettings.musicVolume ?? 70}
            onChange={handleMusicVolume}
            label="Music Volume"
          />
          <GlassSlider
            value={userSettings.sfxVolume ?? 80}
            onChange={handleSfxVolume}
            label="Sound Effects"
          />
        </div>

        {/* Display section */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <p className="text-white/60 text-xs uppercase tracking-wide font-medium">Display</p>
          <GlassToggle checked={pixelArt} onChange={setPixelArt} label="Pixel Art Mode" />
          <GlassToggle checked={showHints} onChange={setShowHints} label="Show Interaction Hints" />
        </div>

        <div className="flex justify-end gap-3">
          <GlassButton variant="secondary" onClick={onClose} size="sm">Cancel</GlassButton>
          <GlassButton onClick={handleSave} size="sm">Save</GlassButton>
        </div>
      </div>
    </GlassModal>
  )
}
