'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { GlassModal } from '@/components/ui/GlassModal'
import { GlassButton } from '@/components/ui/GlassButton'
import { MOOD_EMOJI } from '@/lib/types'
import type { EmotionAnalysis, Mood } from '@/lib/types'

// ── Mood-based local reflections ──────────────────────────────────────────────
const MOOD_REFLECTIONS: Record<Mood, string[]> = {
  happy: [
    "Your entries radiate warmth lately 🌻 — joy isn't random, it's something you've been tending to. Keep noticing what lights you up.",
    "There's a gentle brightness in your recent reflections. Joy is a signal — what small moments have been feeding it? Hold onto those.",
    "Happiness has been showing up in your garden. That's not luck — it's attention. You're noticing the good, and that makes it grow.",
  ],
  gratitude: [
    "Gratitude keeps appearing in your words, like roots that hold the soil together 🌿. You have a gift for noticing abundance.",
    "Your reflections carry a quiet thankfulness. Science shows that noticing what's good literally rewires your brain toward resilience.",
    "There's a softness of appreciation in how you write. Gratitude isn't passive — it's an active choice you keep making. Beautiful.",
  ],
  calm: [
    "A sense of stillness runs through your recent entries ☁️. You seem to be finding your footing. That inner quiet is worth protecting.",
    "Calmness is the mood your garden seems to produce most. It suggests you're doing something right — keep creating that space.",
    "Your reflections feel grounded and steady. Calm isn't always easy to reach — be proud that you're arriving there more often.",
  ],
  growth: [
    "Your entries show someone who leans into discomfort as a teacher 🌱. That mindset of growth is rare and worth celebrating.",
    "Growth keeps emerging in your garden. You're not just journaling — you're actively processing and becoming. That takes real courage.",
    "There's a recurring theme of becoming in what you write. Keep asking 'what can I learn?' — your garden of self grows every time you do.",
  ],
  stressed: [
    "Stress has been a frequent visitor lately 💨. That's okay — your willingness to name it here is already a powerful act of self-care.",
    "You've been carrying a lot. Your reflections show someone who is aware, which is the first step. What's one small thing you can release today?",
    "Stress tends to narrow our view. Your journal is widening it again. Try to notice: amidst the pressure, what small comfort exists right now?",
  ],
  crisis: [
    "It sounds like you've been going through something really heavy 💙. Please be gentle with yourself. You don't have to have it all figured out.",
    "Your words carry real weight. You're not alone in this. Reaching out — to a friend, a helpline, or even to this page — is strength, not weakness.",
    "Hard emotions deserve space, not suppression. You're giving them that here. Take one breath, one moment, one small act of self-kindness today.",
  ],
}

// Pick a deterministic-random reflection (based on entry count so it changes as you journal)
function pickReflection(mood: Mood, seed: number): string {
  const pool = MOOD_REFLECTIONS[mood]
  return pool[seed % pool.length]
}

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
  const {
    dailyRecordOpen, closeDailyRecord, userId, openWeeklyInsight,
    entryCount, streak, localEntries, addLocalEntry, setLastJournalDate,
    incrementEntryCount, quests, updateQuest, setQuestNotification,
  } = useGameStore()
  const [tab, setTab] = useState<'record' | 'insights'>('record')
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [insightsVisible, setInsightsVisible] = useState(false)
  // Quick-log state for days without an entry
  const [quickMood, setQuickMood] = useState<Mood | null>(null)
  const [quickNote, setQuickNote] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)
  const [quickSaved, setQuickSaved] = useState(false)
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

  // ── HOOKS MUST ALL BE ABOVE THE EARLY RETURN ─────────────────────────────
  // Compute effective analysis: API data if available, else derived from localEntries
  const effectiveAnalysis = useMemo<EmotionAnalysis | null>(() => {
    if (analysis && analysis.totalEntries > 0) return analysis
    if (!localEntries.length) return analysis
    const counts: Record<string, number> = {}
    for (const e of localEntries) { counts[e.mood] = (counts[e.mood] ?? 0) + 1 }
    const dominant = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as Mood | null
    const todayDate = new Date()
    const recentMoods: (Mood | null)[] = Array(30).fill(null).map((_, i) => {
      const d = new Date(todayDate); d.setDate(todayDate.getDate() - (29 - i))
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

  // Pre-compute dominant + total so we can use them in hooks below the early return guard
  const preTotal = effectiveAnalysis?.totalEntries ?? 0
  const preDominant = effectiveAnalysis?.dominantMood ?? null
  const localReflectionRaw = preDominant && preTotal > 0 ? pickReflection(preDominant, entryCount) : null
  const typedLocalReflection = useTypewriter(localReflectionRaw)

  if (!dailyRecordOpen) return null

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

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Current Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: '🔥' },
              { label: 'Total Entries', value: String(entryCount || localEntries.length), icon: '📝' },
              { label: 'Best Streak', value: `${bestStreak} day${bestStreak !== 1 ? 's' : ''}`, icon: '⭐' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center border border-white/15">
                <p className="text-xl mb-1">{icon}</p>
                <p className="text-white font-bold text-sm">{value}</p>
                <p className="text-white/50 text-[10px]">{label}</p>
              </div>
            ))}
          </div>

          {/* 30-day calendar */}
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Last 30 Days — tap a day to view</p>
            <div className="grid grid-cols-7 gap-1">
              {calDays.map(({ date, mood, dayIndex }) => {
                const isToday = dayIndex === 29
                return (
                  <button
                    key={dayIndex}
                    onClick={() => setSelectedDay(selectedDay === dayIndex ? null : dayIndex)}
                    className={`flex flex-col items-center justify-center rounded-lg p-1 h-11 transition-all
                      ${isToday ? 'ring-2 ring-white/60' : ''}
                      ${selectedDay === dayIndex ? 'bg-white/20 scale-105' : 'hover:bg-white/10'}
                    `}
                  >
                    <span className="text-[9px] text-white/40">{date.toLocaleDateString([], { weekday: 'narrow' })}</span>
                    <span className="text-[9px] text-white/30">{date.getDate()}</span>
                    {mood ? (
                      <span className={`w-3 h-3 rounded-full mt-0.5 ${MOOD_DOT_COLOR[mood]}`} />
                    ) : (
                      <span className="w-3 h-3 rounded-full mt-0.5 bg-white/10" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected day detail + quick-log */}
          {selectedDay !== null && (() => {
            const day = calDays[selectedDay]
            const dateKey = day.date.toISOString().slice(0, 10)
            const dayEntries = localEntries.filter(e => e.createdAt.startsWith(dateKey))
            const isToday = selectedDay === 29

            return (
              <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3 animate-fadeIn">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                  {day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  {isToday && <span className="ml-2 text-emerald-400">· Today</span>}
                </p>

                {/* Entries for this day */}
                {dayEntries.length > 0 ? (
                  <div className="space-y-2">
                    {dayEntries.map((e, i) => (
                      <div key={i} className="bg-white/8 border border-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{MOOD_EMOJI[e.mood]}</span>
                          <span className="text-white/80 text-xs font-semibold capitalize">{e.mood}</span>
                          <span className="ml-auto text-white/30 text-[10px]">
                            {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' · '}{e.source}
                          </span>
                        </div>
                        {e.note && (
                          <p className="text-white/70 text-sm leading-relaxed italic">
                            &ldquo;{e.note}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/35 text-sm">No entry recorded for this day.</p>
                )}

                {/* Quick-log: add a feeling for today (or past days) */}
                {!quickSaved && (
                  <div className="border-t border-white/10 pt-3 space-y-2">
                    <p className="text-white/60 text-xs">
                      {dayEntries.length > 0 ? 'Add another feeling this day 💬' : 'Log how you felt this day ✏️'}
                    </p>
                    {/* Mood picker */}
                    <div className="flex flex-wrap gap-1.5">
                      {(['happy', 'gratitude', 'calm', 'growth', 'stressed', 'crisis'] as Mood[]).map(m => (
                        <button
                          key={m}
                          onClick={() => setQuickMood(quickMood === m ? null : m)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${quickMood === m
                              ? 'bg-white/25 border-white/50 text-white font-semibold scale-105'
                              : 'bg-white/8 border-white/15 text-white/60 hover:bg-white/15'
                            }`}
                        >
                          <span>{MOOD_EMOJI[m]}</span>
                          <span className="capitalize">{m}</span>
                        </button>
                      ))}
                    </div>
                    {/* Optional note */}
                    <textarea
                      value={quickNote}
                      onChange={e => setQuickNote(e.target.value)}
                      placeholder="Add a note (optional)…"
                      rows={2}
                      className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm
                        text-white placeholder-white/30 resize-none outline-none
                        focus:border-white/30 focus:bg-white/12 transition-all"
                    />
                    {/* Save button */}
                    <button
                      disabled={!quickMood || quickSaving}
                      onClick={async () => {
                        if (!quickMood) return
                        setQuickSaving(true)
                        const createdAt = new Date(dateKey + 'T12:00:00').toISOString()
                        addLocalEntry({ mood: quickMood, tags: [], createdAt, source: 'journal', note: quickNote.trim() || undefined })
                        incrementEntryCount()
                        setLastJournalDate(dateKey)
                        // Quest: first reflection
                        const firstReflQ = quests.find(q => q.quest_key === 'first_reflection')
                        if (firstReflQ && firstReflQ.status !== 'completed') {
                          updateQuest('first_reflection', 1, 'completed')
                          setQuestNotification('Quest complete: First Reflection planted! 🌱')
                          setTimeout(() => setQuestNotification(null), 3500)
                        }
                        // Quest: weekly reflection progress
                        const weeklyQ = quests.find(q => q.quest_key === 'weekly_reflection')
                        if (weeklyQ && weeklyQ.status !== 'completed') {
                          const np = Math.min(weeklyQ.progress + 1, 7)
                          updateQuest('weekly_reflection', np, np >= 7 ? 'completed' : 'active')
                          if (np >= 7) {
                            setQuestNotification('You have 7 reflections! View your Weekly Insight! 📊')
                            setTimeout(() => setQuestNotification(null), 5000)
                          }
                        }
                        setQuickSaving(false)
                        setQuickSaved(true)
                        setQuickMood(null)
                        setQuickNote('')
                        setTimeout(() => setQuickSaved(false), 2500)
                      }}
                      className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${quickMood
                          ? 'bg-emerald-500/80 hover:bg-emerald-500 text-white shadow-lg'
                          : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                    >
                      {quickSaving ? 'Saving…' : 'Save Feeling'}
                    </button>
                  </div>
                )}
                {quickSaved && (
                  <div className="text-center py-3 animate-fadeIn">
                    <p className="text-emerald-400 text-sm font-semibold">✓ Feeling saved!</p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Previous Entries log */}
          {localEntries.length > 0 && (
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Previous Entries</p>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {[...localEntries].reverse().slice(0, 15).map((e, i) => (
                  <div key={i} className="bg-white/6 border border-white/10 rounded-xl p-3 flex gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{MOOD_EMOJI[e.mood]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-white/80 text-xs font-semibold capitalize">{e.mood}</span>
                        <span className="text-white/30 text-[10px] flex-shrink-0">
                          {new Date(e.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {e.note ? (
                        <p className="text-white/65 text-xs leading-relaxed mt-0.5 truncate">
                          {e.note}
                        </p>
                      ) : (
                        <p className="text-white/25 text-xs italic mt-0.5">{e.source} check-in</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
              ) : dominant && total > 0 ? (
                // Local mood-based reflection — works for guests without API
                <p className="text-white/85 text-sm leading-relaxed">
                  {typedLocalReflection}
                  <span className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 align-middle animate-pulse" />
                </p>
              ) : (
                <p className="text-white/40 text-sm italic">Write a few more entries to unlock your personal reflection.</p>
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
