'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { GlassModal } from '@/components/ui/GlassModal'
import { GlassButton } from '@/components/ui/GlassButton'
import { MOOD_EMOJI } from '@/lib/types'
import type { EmotionAnalysis, Mood } from '@/lib/types'

// ── Mood color maps ───────────────────────────────────────────────────────────
const MOOD_DOT_COLOR: Record<Mood, string> = {
  happy: 'bg-yellow-400',
  gratitude: 'bg-orange-300',
  calm: 'bg-sky-400',
  stressed: 'bg-purple-400',
  growth: 'bg-emerald-400',
  crisis: 'bg-blue-400',
}

const MOOD_GLOW: Record<Mood, string> = {
  happy: '#facc15',
  gratitude: '#fb923c',
  calm: '#38bdf8',
  stressed: '#c084fc',
  growth: '#34d399',
  crisis: '#60a5fa',
}

const MOOD_GRADIENT: Record<Mood, string> = {
  happy: 'from-yellow-400/30 to-amber-500/30',
  gratitude: 'from-orange-400/30 to-pink-400/30',
  calm: 'from-sky-400/30 to-blue-500/30',
  stressed: 'from-purple-400/30 to-violet-500/30',
  growth: 'from-emerald-400/30 to-green-500/30',
  crisis: 'from-blue-400/30 to-indigo-500/30',
}

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text: string | null, speed = 18): string {
  const [displayed, setDisplayed] = useState('')
  const prev = useRef<string | null>(null)

  useEffect(() => {
    if (!text) { setDisplayed(''); return }
    if (text === prev.current) return
    prev.current = text
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return displayed
}

// ── Animated count-up bar ─────────────────────────────────────────────────────
function AnimBar({ mood, count, maxCount, delay }: { mood: Mood; count: number; maxCount: number; delay: number }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth((count / maxCount) * 100), delay)
    return () => clearTimeout(t)
  }, [count, maxCount, delay])

  const barColors: Record<Mood, string> = {
    happy: 'bg-gradient-to-r from-yellow-300 to-amber-400',
    gratitude: 'bg-gradient-to-r from-orange-300 to-pink-400',
    calm: 'bg-gradient-to-r from-sky-300 to-blue-400',
    stressed: 'bg-gradient-to-r from-purple-300 to-violet-400',
    growth: 'bg-gradient-to-r from-emerald-300 to-green-400',
    crisis: 'bg-gradient-to-r from-blue-300 to-indigo-400',
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg w-6 text-center">{MOOD_EMOJI[mood]}</span>
      <span className="text-white/70 text-xs capitalize w-16 flex-shrink-0">{mood}</span>
      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full ${barColors[mood]} transition-all duration-700 ease-out relative`}
          style={{ width: `${width}%` }}
        >
          {/* Shine sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-full" />
        </div>
      </div>
      <span className="text-white/60 text-xs w-5 text-right font-bold tabular-nums">{count}</span>
    </div>
  )
}

// ── Floating orb particles ────────────────────────────────────────────────────
function FloatingParticles({ mood }: { mood: Mood }) {
  const emojis = [MOOD_EMOJI[mood], '✨', '🌟', '💫', MOOD_EMOJI[mood]]
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {emojis.map((e, i) => (
        <span
          key={i}
          className="absolute text-lg opacity-0 animate-floatUp select-none"
          style={{
            left: `${15 + i * 17}%`,
            bottom: '10%',
            animationDelay: `${i * 0.6}s`,
            animationDuration: `${3 + i * 0.4}s`,
            animationIterationCount: 'infinite',
          }}
        >
          {e}
        </span>
      ))}
    </div>
  )
}

// ── Pulsing dominant mood orb ─────────────────────────────────────────────────
function DominantMoodOrb({ mood }: { mood: Mood }) {
  const glow = MOOD_GLOW[mood]
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="relative flex items-center justify-center">
        {/* Outer rings */}
        <div
          className="absolute rounded-full animate-ping opacity-20"
          style={{ width: 80, height: 80, background: glow }}
        />
        <div
          className="absolute rounded-full animate-pulse opacity-30"
          style={{ width: 64, height: 64, background: glow }}
        />
        {/* Main orb */}
        <div
          className="relative w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-2xl border-2 border-white/30"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${glow}99, ${glow}44)`,
            boxShadow: `0 0 30px ${glow}88, 0 0 60px ${glow}44`,
          }}
        >
          {MOOD_EMOJI[mood]}
        </div>
      </div>
      <div className="text-center">
        <p className="text-white/50 text-[10px] uppercase tracking-widest">Dominant Mood</p>
        <p className="text-white font-bold text-base capitalize">{mood}</p>
      </div>
    </div>
  )
}

// ── Spinning stars background ─────────────────────────────────────────────────
function StarField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse-soft"
          style={{
            width: 1 + (i % 2),
            height: 1 + (i % 2),
            top: `${(i * 17 + 5) % 90}%`,
            left: `${(i * 23 + 8) % 92}%`,
            opacity: 0.15 + (i % 4) * 0.08,
            animationDelay: `${(i * 0.4) % 3}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function DailyRecordModal() {
  const { dailyRecordOpen, closeDailyRecord, userId, openWeeklyInsight, entryCount, streak, localEntries } = useGameStore()
  const [tab, setTab] = useState<'record' | 'insights'>('record')
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [insightsVisible, setInsightsVisible] = useState(false)

  const typedNarrative = useTypewriter(narrative)

  useEffect(() => {
    if (!dailyRecordOpen || !userId) return
    fetch(`/api/emotion-analysis?userId=${userId}`)
      .then((r) => r.json())
      .then(setAnalysis)
      .catch(console.error)
  }, [dailyRecordOpen, userId, entryCount])

  useEffect(() => {
    setNarrative(null)
  }, [entryCount])

  useEffect(() => {
    if (tab !== 'insights') { setInsightsVisible(false); return }
    const t = setTimeout(() => setInsightsVisible(true), 80)
    return () => clearTimeout(t)
  }, [tab])

  useEffect(() => {
    if (tab !== 'insights' || narrative !== null || !userId) return
    setLoadingInsights(true)
    fetch('/api/weekly-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, allEntries: true }),
    })
      .then((r) => r.json())
      .then((d) => setNarrative(d.summary || null))
      .catch(console.error)
      .finally(() => setLoadingInsights(false))
  }, [tab, narrative, userId])

  if (!dailyRecordOpen) return null

  // Compute effective analysis: API data if available, else derived from localEntries
  const effectiveAnalysis = useMemo<EmotionAnalysis | null>(() => {
    if (analysis && analysis.totalEntries > 0) return analysis
    if (!localEntries.length) return analysis
    const counts: Record<string, number> = {}
    for (const e of localEntries) { counts[e.mood] = (counts[e.mood] ?? 0) + 1 }
    const dominant = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as Mood | null
    const today = new Date()
    const recentMoods: (Mood | null)[] = Array(30).fill(null).map((_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - (29 - i))
      const key = d.toISOString().slice(0, 10)
      return localEntries.find(e => e.createdAt.startsWith(key))?.mood as Mood | null ?? null
    })
    return {
      totalEntries: localEntries.length,
      moodCounts: counts as Record<Mood, number>,
      dominantMood: dominant,
      recentMoods,
      tags: [],
    } as EmotionAnalysis
  }, [analysis, localEntries])

  const recentMoods: (Mood | null)[] = effectiveAnalysis?.recentMoods ?? Array(30).fill(null)
  const today = new Date()

  const calDays = recentMoods.map((mood, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    return { date: d, mood, dayIndex: i }
  })

  const bestStreak = (() => {
    let best = 0, cur = 0
    for (const m of recentMoods) {
      if (m !== null) { cur++; if (cur > best) best = cur } else cur = 0
    }
    return best
  })()

  const moodOrder: Mood[] = ['happy', 'gratitude', 'calm', 'growth', 'stressed', 'crisis']
  const moodCounts = effectiveAnalysis?.moodCounts ?? {}
  const total = effectiveAnalysis?.totalEntries ?? 0
  const maxCount = Math.max(1, ...Object.values(moodCounts))
  const dominant = effectiveAnalysis?.dominantMood ?? null

  return (
    <GlassModal isOpen={dailyRecordOpen} onClose={closeDailyRecord} title="Daily Record" maxWidth="max-w-lg">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['record', 'insights'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${tab === t
                ? 'bg-white/25 text-white border border-white/40'
                : 'bg-white/8 text-white/50 hover:bg-white/15'
              }`}
          >
            {t === 'record' ? '📅 Daily Record' : '✨ AI Insights'}
          </button>
        ))}
      </div>

      {/* ── DAILY RECORD TAB ──────────────────────────────────────────────── */}
      {tab === 'record' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Current Streak', value: `${streak} days`, icon: '🔥' },
              { label: 'Total Entries', value: String(entryCount), icon: '📝' },
              { label: 'Best Streak (30d)', value: `${bestStreak} days`, icon: '⭐' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center border border-white/15">
                <p className="text-xl mb-1">{icon}</p>
                <p className="text-white font-bold text-sm">{value}</p>
                <p className="text-white/50 text-[10px]">{label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Last 30 Days</p>
            <div className="grid grid-cols-7 gap-1">
              {calDays.map(({ date, mood, dayIndex }) => {
                const isToday = dayIndex === 29
                return (
                  <button
                    key={dayIndex}
                    onClick={() => setSelectedDay(selectedDay === dayIndex ? null : dayIndex)}
                    className={`flex flex-col items-center justify-center rounded-lg p-1 h-10 transition-all
                      ${isToday ? 'ring-2 ring-white/60' : ''}
                      ${selectedDay === dayIndex ? 'bg-white/20' : 'hover:bg-white/10'}
                    `}
                  >
                    <span className="text-[9px] text-white/40">{date.getDate()}</span>
                    {mood ? (
                      <span className={`w-3 h-3 rounded-full ${MOOD_DOT_COLOR[mood]}`} />
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-white/15" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedDay !== null && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-3 animate-fadeIn">
              <p className="text-white/60 text-xs mb-1">
                {calDays[selectedDay].date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              {calDays[selectedDay].mood ? (
                <p className="text-white text-sm font-medium">
                  {MOOD_EMOJI[calDays[selectedDay].mood!]} Mood: <span className="capitalize">{calDays[selectedDay].mood}</span>
                </p>
              ) : (
                <p className="text-white/40 text-sm">No entry this day</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AI INSIGHTS TAB ───────────────────────────────────────────────── */}
      {tab === 'insights' && (
        <div
          className={`space-y-4 transition-all duration-500 ${insightsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Dominant mood hero orb */}
          {dominant && total > 0 && (
            <div className={`relative rounded-2xl p-4 bg-gradient-to-br ${MOOD_GRADIENT[dominant]} border border-white/20 overflow-hidden`}>
              <StarField />
              {dominant && <FloatingParticles mood={dominant} />}
              <DominantMoodOrb mood={dominant} />
            </div>
          )}

          {/* Mood distribution bars */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-white/60 text-xs uppercase tracking-wide mb-3">Mood Distribution</p>
            <div className="space-y-2.5">
              {moodOrder.map((mood, i) => {
                const count = moodCounts[mood] ?? 0
                if (count === 0) return null
                return (
                  <AnimBar key={mood} mood={mood} count={count} maxCount={maxCount} delay={i * 120} />
                )
              })}
              {total === 0 && (
                <div className="flex flex-col items-center py-4 gap-2">
                  <span className="text-3xl animate-bounce">🌱</span>
                  <p className="text-white/40 text-sm text-center">Start journaling to see your mood patterns here.</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Narrative with typewriter */}
          <div className="relative rounded-2xl overflow-hidden border border-white/15">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/40" />
            <StarField />
            <div className="relative p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg animate-pulse-soft">🔮</span>
                <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">AI Reflection</p>
              </div>
              {loadingInsights ? (
                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-white/40 text-xs">Weaving your story...</p>
                </div>
              ) : typedNarrative ? (
                <p className="text-white/85 text-sm leading-relaxed">
                  {typedNarrative}
                  <span className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 align-middle animate-pulse" />
                </p>
              ) : (
                <p className="text-white/40 text-sm italic">Write a few more entries to unlock your personal narrative.</p>
              )}
            </div>
          </div>

          {/* Top tags cloud */}
          {(effectiveAnalysis?.tags ?? []).length > 0 && (
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Common Themes</p>
              <div className="flex flex-wrap gap-2">
                {(effectiveAnalysis?.tags ?? []).map((tag, i) => (
                  <span
                    key={tag}
                    className="text-xs bg-white/15 border border-white/20 rounded-full px-3 py-1 text-white/80
                      hover:bg-white/25 transition-all cursor-default animate-fadeIn"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => { closeDailyRecord(); openWeeklyInsight([]) }}
            className="w-full"
          >
            Open Weekly Insight 📊
          </GlassButton>
        </div>
      )}
    </GlassModal>
  )
}
