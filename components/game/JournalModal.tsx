'use client'

import { useState } from 'react'
import { GlassModal } from '@/components/ui/GlassModal'
import { GlassButton } from '@/components/ui/GlassButton'
import { useGameStore } from '@/lib/gameStore'
import { EventBridge } from '@/game/EventBridge'
import type { AnalyzeResult, Mood } from '@/lib/types'
import { MOOD_EMOJI, MOOD_TO_PLANT, QUESTS } from '@/lib/types'

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
  const {
    journalOpen, closeJournal, openBreathing, userId,
    addPlant, incrementEntryCount, entryCount, plants,
    setLastMood, setLastAnalysis, setQuestNotification, quests, updateQuest,
    addLocalEntry, lastBreathDate, setLastJournalDate,
  } = useGameStore()
  const [text, setText] = useState('')
  const [selectedMood, setSelectedMood] = useState<keyof typeof MOOD_EMOJI | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [showPrompts, setShowPrompts] = useState(false)
  const [selectedPrompts,] = useState(() =>
    [...GENTLE_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3)
  )

  const handleClose = () => {
    closeJournal()
    setResult(null)
    setText('')
    setSelectedMood(null)
  }

  const handleSubmit = async () => {
    if (!text.trim() || loading || !selectedMood) return
    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId, overrideMood: selectedMood }),
      })
      const data: AnalyzeResult = await res.json()
      const finalMood = data.mood === 'crisis' ? 'crisis' : (selectedMood || data.mood)
      data.mood = finalMood

      setResult(data)
      setLastMood(data.mood)
      setLastAnalysis(data)

      if (data.mood !== 'crisis') {
        // DB save (logged-in users only)
        if (userId) {
          const plantType = MOOD_TO_PLANT[data.mood]
          if (plantType) {
            const { GardenSystem } = await import('@/game/systems/GardenSystem')
            const nextPos = GardenSystem.getNextPlotPosition(plants)
            if (nextPos) {
              const plantRes = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text, userId, savePlant: true,
                  tileX: nextPos.x, tileY: nextPos.y,
                  plantType, mood: data.mood, confidence: data.confidence,
                  tags: data.tags, shortPrompt: data.short_reflection_prompt,
                }),
              })
              const { plant } = await plantRes.json().catch(() => ({ plant: null }))
              if (plant) { addPlant(plant); EventBridge.emit('plantAdded', plant) }
            }
          }
        }

        // Always: local entry + counters + quests (guests included)
        addLocalEntry({ mood: data.mood as Mood, tags: data.tags ?? [], createdAt: new Date().toISOString(), source: 'journal', note: text.trim() })
        incrementEntryCount()
        const today = new Date().toISOString().slice(0, 10)
        setLastJournalDate(today)
        EventBridge.emit('journalCompleted', undefined as unknown as void)

        // Quest: first reflection
        const firstReflQ = quests.find(q => q.quest_key === 'first_reflection')
        if (firstReflQ && firstReflQ.status !== 'completed' && entryCount === 0) {
          updateQuest('first_reflection', 1, 'completed')
          setQuestNotification('Quest complete: First Reflection planted!')
          setTimeout(() => setQuestNotification(null), 3000)
        }

        // Quest: weekly reflection
        const weeklyQ = quests.find(q => q.quest_key === 'weekly_reflection')
        if (weeklyQ && weeklyQ.status !== 'completed') {
          const newProgress = Math.min(weeklyQ.progress + 1, 7)
          updateQuest('weekly_reflection', newProgress, newProgress >= 7 ? 'completed' : 'active')
          if (newProgress >= 7) {
            setQuestNotification('You have 7 reflections! View your Weekly Insight!')
            setTimeout(() => setQuestNotification(null), 5000)
          }
        }

        // Quest: breath_and_reflect (both done today)
        if (lastBreathDate === today) {
          const baq = quests.find(q => q.quest_key === 'breath_and_reflect')
          if (baq && baq.status !== 'completed') {
            updateQuest('breath_and_reflect', 1, 'completed')
            setQuestNotification('Quest complete: Breathe & Reflect!')
            setTimeout(() => setQuestNotification(null), 4000)
          }
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
            How are you feeling right now? Pick the emotion that fits best.
          </p>

          <div className="flex flex-wrap gap-2">
            {(Object.entries(MOOD_EMOJI) as [keyof typeof MOOD_EMOJI, string][]).map(([m, emoji]) => {
              if (m === 'crisis') return null
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMood(m)}
                  className={`flex flex-col items-center justify-center p-1 md:p-2 rounded-xl transition-all w-14 h-14 md:w-[72px] md:h-[72px] border ${selectedMood === m
                    ? 'bg-white/30 border-white shadow-xl scale-105'
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                >
                  <span className="text-xl md:text-2xl mb-1">{emoji}</span>
                  <span className="text-[9px] md:text-[10px] text-white/90 capitalize font-medium">{m}</span>
                </button>
              )
            })}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Today I felt... / I am noticing... / I am grateful for..."
            className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-3
              text-white placeholder-white/40 text-sm resize-none
              focus:outline-none focus:border-white/40 focus:bg-white/15
              font-sans"
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
                    className="text-[10px] md:text-xs bg-white/15 hover:bg-white/25 border border-white/20
                      rounded-full px-2 py-1 md:px-3 text-white/80 transition-colors"
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
              disabled={!text.trim() || !selectedMood || loading}
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
            <div className="space-y-3 md:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2">
              {/* Quest progress */}
              {(() => {
                const weeklyQ = quests.find((q) => q.quest_key === 'weekly_reflection')
                const questDef = QUESTS.find((q) => q.key === 'weekly_reflection')
                if (!weeklyQ || !questDef || weeklyQ.status === 'completed') return null
                const prog = Math.min(weeklyQ.progress, questDef.target)
                return (
                  <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center">
                    <p className="text-white/70 text-xs">
                      Quest: Weekly Reflection — <span className="font-bold text-white">{prog} of {questDef.target}</span> complete
                    </p>
                  </div>
                )
              })()}

              <div className="text-center space-y-1 md:space-y-2 mb-2 md:mb-4">
                <h3 className="text-xl md:text-2xl font-serif text-white tracking-wide">A Moment of Reflection</h3>
                <p className="text-white/70 text-xs md:text-sm">Thank you for pausing and checking in with yourself.</p>
              </div>

              {/* Result card */}
              <div className={`bg-gradient-to-br ${TONE_GRADIENTS[result.tone_color] || TONE_GRADIENTS.soft_blue} rounded-3xl p-4 md:p-8 border border-white/40 shadow-2xl relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="flex flex-col items-center gap-2 md:gap-4 mb-3 md:mb-6 relative z-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl md:text-4xl shadow-inner border border-white/30 backdrop-blur-sm">
                    {MOOD_EMOJI[result.mood]}
                  </div>
                  <div className="text-center">
                    <p className="text-white font-serif text-xl md:text-2xl capitalize tracking-wide">{result.mood}</p>
                  </div>
                </div>

                <div className="bg-black/15 rounded-2xl p-3 md:p-6 relative z-10 border border-white/20 shadow-inner">
                  <p className="text-white text-sm md:text-lg leading-relaxed font-medium text-center italic">
                    "{result.short_reflection_prompt}"
                  </p>
                </div>
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center py-2">
                  {result.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm bg-white/20 border border-white/30 rounded-full px-4 py-1.5 text-white shadow-sm font-medium tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center gap-1 md:gap-2 shadow-inner mt-2 md:mt-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-400/40 flex items-center justify-center text-xl md:text-2xl shadow-sm">
                  🌱
                </div>
                <div>
                  <p className="text-white font-semibold text-sm md:text-base mb-1">
                    Your Garden Grows
                  </p>
                  <p className="text-emerald-50 text-sm">
                    A beautiful <span className="font-bold text-white uppercase tracking-wider">{MOOD_TO_PLANT[result.mood] || 'seed'}</span> was planted in your garden to honor this moment.
                  </p>
                </div>
              </div>

              {result.mood === 'stressed' && (
                <div className="bg-purple-500/20 border border-purple-400/40 rounded-2xl p-4 flex flex-col gap-2">
                  <p className="text-white/80 text-sm text-center">
                    Feeling heavy? A breathing exercise might help 🌬️
                  </p>
                  <button
                    onClick={() => { handleClose(); openBreathing() }}
                    className="w-full py-2 rounded-xl text-white text-sm font-semibold
                      bg-purple-500/40 border border-purple-400/50 hover:bg-purple-500/60 transition-all"
                  >
                    Try a Breathing Exercise
                  </button>
                </div>
              )}

              <GlassButton onClick={handleClose} className="w-full mt-4 font-bold text-lg py-3">
                Return to the Farm
              </GlassButton>
            </div>
          )}
        </div>
      )}
    </GlassModal>
  )
}
