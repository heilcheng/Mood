'use client'

import { useState } from 'react'
import { GlassModal } from '@/components/ui/GlassModal'
import { GlassButton } from '@/components/ui/GlassButton'
import { useGameStore } from '@/lib/gameStore'
import { EventBridge } from '@/game/EventBridge'
import type { AnalyzeResult } from '@/lib/types'
import { MOOD_EMOJI, MOOD_TO_PLANT } from '@/lib/types'

const GENTLE_PROMPTS = [
  "What is one thing that stood out to you today?",
  "How does your body feel right now?",
  "What are you grateful for in this moment?",
  "What emotion visited you most today?",
  "What would you like to release before tomorrow?",
]

const TONE_GRADIENTS: Record<string, string> = {
  sunny: 'from-yellow-300/60 to-amber-400/60',
  warm: 'from-orange-300/60 to-pink-300/60',
  soft_blue: 'from-sky-300/60 to-blue-400/60',
  lavender: 'from-lavender-300/60 to-purple-400/60',
  fresh_green: 'from-sage-300/60 to-emerald-400/60',
}

const CRISIS_RESOURCES = [
  "988 Suicide & Crisis Lifeline: Call or text 988 (US)",
  "Crisis Text Line: Text HOME to 741741",
  "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/",
]

export function JournalModal() {
  const { journalOpen, closeJournal, userId, addPlant, incrementEntryCount, entryCount, plants, setLastMood, setLastAnalysis, setQuestNotification } = useGameStore()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [showPrompts, setShowPrompts] = useState(false)
  const [selectedPrompts, ] = useState(() =>
    [...GENTLE_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3)
  )

  const handleClose = () => {
    closeJournal()
    setResult(null)
    setText('')
  }

  const handleSubmit = async () => {
    if (!text.trim() || loading) return
    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId }),
      })
      const data: AnalyzeResult = await res.json()
      setResult(data)
      setLastMood(data.mood)
      setLastAnalysis(data)

      // Save journal entry + plant via analyze route (which handles DB)
      if (data.mood !== 'crisis' && userId) {
        const plantType = MOOD_TO_PLANT[data.mood]
        if (plantType) {
          const { GardenSystem } = await import('@/game/systems/GardenSystem')
          const nextPos = GardenSystem.getNextPlotPosition(plants)
          if (nextPos) {
            const plantRes = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text,
                userId,
                savePlant: true,
                tileX: nextPos.x,
                tileY: nextPos.y,
                plantType,
                mood: data.mood,
                confidence: data.confidence,
                tags: data.tags,
                shortPrompt: data.short_reflection_prompt,
              }),
            })
            const { plant } = await plantRes.json().catch(() => ({ plant: null }))
            if (plant) {
              addPlant(plant)
              EventBridge.emit('plantAdded', plant)
            }
          }
        }

        incrementEntryCount()

        // Quest: first reflection
        if (entryCount === 0) {
          setQuestNotification('Quest complete: First Reflection planted!')
          setTimeout(() => setQuestNotification(null), 3000)
        }

        // Check weekly
        if ((entryCount + 1) >= 7) {
          setQuestNotification('You have 7 reflections! View your Weekly Insight!')
          setTimeout(() => setQuestNotification(null), 5000)
        }
      }
    } catch (err) {
      console.error('Journal submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!journalOpen) return null

  return (
    <GlassModal isOpen={journalOpen} onClose={handleClose} title="Journal House" maxWidth="max-w-xl">
      {!result ? (
        <div className="space-y-4">
          <p className="text-white/80 text-sm">
            Share what is in your heart. Every feeling is welcome here.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Today I felt... / I am noticing... / I am grateful for..."
            className="w-full h-36 bg-white/10 border border-white/20 rounded-xl p-3
              text-white placeholder-white/40 text-sm resize-none
              focus:outline-none focus:border-white/40 focus:bg-white/15
              font-sans"
            autoFocus
          />

          {/* Gentle prompts */}
          <div>
            <button
              onClick={() => setShowPrompts(!showPrompts)}
              className="text-xs text-white/60 hover:text-white/80 transition-colors underline"
            >
              {showPrompts ? 'Hide' : 'Show'} gentle prompts
            </button>
            {showPrompts && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setText(text ? `${text}\n${p}` : p)}
                    className="text-xs bg-white/15 hover:bg-white/25 border border-white/20
                      rounded-full px-3 py-1 text-white/80 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <GlassButton variant="secondary" onClick={handleClose} size="sm">
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleSubmit}
              disabled={!text.trim() || loading}
              size="sm"
            >
              {loading ? 'Planting...' : 'Plant My Reflection'}
            </GlassButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {result.mood === 'crisis' ? (
            <div className="space-y-4">
              <div className="bg-sky-400/30 border border-sky-300/40 rounded-xl p-4">
                <p className="text-white font-semibold mb-2">You are not alone.</p>
                <p className="text-white/80 text-sm mb-3">
                  Thank you for sharing. If you are struggling, please reach out to someone who can help.
                </p>
                <div className="space-y-2">
                  {CRISIS_RESOURCES.map((r, i) => (
                    <p key={i} className="text-xs text-white/70">{r}</p>
                  ))}
                </div>
              </div>
              <GlassButton variant="secondary" onClick={handleClose}>Close</GlassButton>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Result card */}
              <div className={`bg-gradient-to-br ${TONE_GRADIENTS[result.tone_color] || TONE_GRADIENTS.soft_blue} rounded-2xl p-4 border border-white/30`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{MOOD_EMOJI[result.mood]}</span>
                  <div>
                    <p className="text-white font-bold capitalize">{result.mood}</p>
                    <p className="text-white/70 text-xs">
                      {Math.round(result.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
                <p className="text-white/90 text-sm italic">{result.short_reflection_prompt}</p>
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-white/20 border border-white/25 rounded-full px-2.5 py-1 text-white/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-white/70 text-xs">
                A new {MOOD_TO_PLANT[result.mood] || 'plant'} has been planted in your garden.
              </p>

              <GlassButton onClick={handleClose} className="w-full">
                Return to Farm
              </GlassButton>
            </div>
          )}
        </div>
      )}
    </GlassModal>
  )
}
