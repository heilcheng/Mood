'use client'

import { useState, useEffect } from 'react'
import { GlassModal } from '@/components/ui/GlassModal'
import { GlassButton } from '@/components/ui/GlassButton'
import { useGameStore } from '@/lib/gameStore'
import type { WeeklySummary } from '@/lib/types'
import { MOOD_EMOJI } from '@/lib/types'

export function WeeklyInsightModal() {
  const { weeklyInsightOpen, closeWeeklyInsight, weeklyEntries, userId } = useGameStore()
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!weeklyInsightOpen || !userId) return
    setLoading(true)
    setRevealed(false)
    setSummary(null)

    fetch('/api/weekly-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: weeklyEntries || [], userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSummary(data)
        setTimeout(() => setRevealed(true), 300)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [weeklyInsightOpen, userId, weeklyEntries])

  // Gather mood tags from entries
  const moodTags = weeklyEntries
    ? [...new Set(weeklyEntries.map((e) => e.mood))].slice(0, 5)
    : []

  return (
    <GlassModal
      isOpen={weeklyInsightOpen}
      onClose={closeWeeklyInsight}
      title="Weekly Garden Insight"
      maxWidth="max-w-xl"
    >
      {loading ? (
        <div className="flex flex-col items-center py-8 gap-4">
          <div className="w-10 h-10 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Reflecting on your week...</p>
        </div>
      ) : summary ? (
        <div className={`space-y-5 transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Summary */}
          <div className="bg-gradient-to-br from-lavender-400/30 to-sky-400/30 rounded-2xl p-4 border border-white/20">
            <p className="text-white/90 text-sm leading-relaxed">{summary.summary}</p>
          </div>

          {/* Mood tags */}
          {moodTags.length > 0 && (
            <div>
              <p className="text-white/60 text-xs mb-2 uppercase tracking-wide">Emotions this week</p>
              <div className="flex flex-wrap gap-2">
                {moodTags.map((mood) => (
                  <span
                    key={mood}
                    className="flex items-center gap-1 bg-white/15 border border-white/20 rounded-full px-3 py-1 text-sm text-white"
                  >
                    {MOOD_EMOJI[mood as keyof typeof MOOD_EMOJI] || '🌱'} {mood}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Highlights */}
          {summary.highlights.length > 0 && (
            <div>
              <p className="text-white/60 text-xs mb-2 uppercase tracking-wide">Highlights</p>
              <ul className="space-y-2">
                {summary.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sage-300 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-white/80 text-sm">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Focus */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-3">
            <p className="text-white/60 text-xs mb-1 uppercase tracking-wide">Focus for next week</p>
            <p className="text-white/90 text-sm">{summary.suggested_focus}</p>
          </div>

          {/* Unlock badge (if applicable) */}
          {(weeklyEntries?.length ?? 0) >= 7 && (
            <div className="bg-cream-400/30 border border-cream-300/40 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">🏮</span>
              <div>
                <p className="text-white font-semibold text-sm">New Unlock: Lantern Decor!</p>
                <p className="text-white/70 text-xs">Your garden now glows with lanterns at night</p>
              </div>
            </div>
          )}

          <GlassButton onClick={closeWeeklyInsight} className="w-full">
            Back to Farm
          </GlassButton>
        </div>
      ) : (
        <p className="text-white/60 text-sm text-center py-4">No entries found for this week.</p>
      )}
    </GlassModal>
  )
}
