'use client'

import { useState, useEffect, useMemo } from 'react'
import { GlassModal } from '@/components/ui/GlassModal'
import { GlassButton } from '@/components/ui/GlassButton'
import { useGameStore } from '@/lib/gameStore'
import type { WeeklySummary, Mood } from '@/lib/types'
import { MOOD_EMOJI } from '@/lib/types'

// ── Local insight generator ────────────────────────────────────────────────────
type MoodCounts = Partial<Record<Mood, number>>

interface LocalInsight {
  summary: string
  highlights: string[]
  suggested_focus: string
}

const SUMMARIES: Record<Mood, string[]> = {
  happy: [
    "This week your farm bloomed with joy 🌻 — your entries carry a lightness that's hard to fake. You've been genuinely appreciating the small wins.",
    "Joy was the weather of your week. Your reflections show a heart that's been open and present. That kind of happiness is earned, not found.",
  ],
  gratitude: [
    "Gratitude dominated your week like morning dew 🌿 — small, everywhere, and quietly nourishing. You have a beautiful eye for abundance.",
    "Your week was rich with thankfulness. You wrote like someone who notices what others overlook — and that makes all the difference.",
  ],
  calm: [
    "Calm was your companion this week ☁️. Your entries feel unhurried and grounded. You seem to be building a steady inner rhythm.",
    "Stillness ran through your reflections this week. You've been anchored. That quiet strength is the foundation everything else grows from.",
  ],
  growth: [
    "Growth is the theme of your week 🌱. You've been asking hard questions and sitting with uncertain answers — that's where real change lives.",
    "Your reflections this week show someone leaning into becoming. You're not waiting for life to shift — you're shifting with it. That matters.",
  ],
  stressed: [
    "Stress was a recurring visitor this week 💨. You named it honestly — which is braver than it sounds. The first step to releasing pressure is admitting it's there.",
    "This week felt heavy, and your entries reflect that. You carried a lot. But you also kept showing up here — that's not nothing, that's everything.",
  ],
  crisis: [
    "This was a hard week 💙. Your words carry real weight, and that deserves acknowledgement. You don't have to fix everything at once — just one breath, one moment.",
    "Something big has been moving through you this week. Writing it down took courage. Please be tender with yourself — you're doing better than you think.",
  ],
}

const HIGHLIGHTS: Record<Mood, string[][]> = {
  happy: [
    ["You journaled consistently — joy compounds when you track it", "You noticed specific moments of happiness rather than vague feelings", "Your emotional vocabulary is growing richer and more precise"],
    ["Positive entries outnumbered difficult ones — a genuine achievement", "You captured gratitude in small details, not just big events", "Your reflections show emotional awareness without over-analysis"],
  ],
  gratitude: [
    ["You actively named things you're grateful for — not just felt them", "Your entries show a balance of receiving and appreciating", "You wrote about people and relationships with real tenderness"],
    ["Gratitude appeared even on harder days — a sign of resilience", "You connected small blessings to larger wellbeing patterns", "Your language this week was warm and specific"],
  ],
  calm: [
    ["You maintained emotional equilibrium through multiple reflections", "Your entries show a mind that isn't fighting itself this week", "You seem to have created space — in time or in thought — for yourself"],
    ["Calmness in your entries suggests you've been proactive about rest", "You wrote without urgency — a rare and healthy sign", "Your reflections are measured and self-compassionate"],
  ],
  growth: [
    ["You asked difficult questions without demanding immediate answers", "Your entries show genuine curiosity about your own patterns", "You reframed a challenge as a learning opportunity"],
    ["Growth mindset appeared consistently across your entries", "You showed awareness of where you want to develop", "Your reflections reveal someone who's listening to themselves carefully"],
  ],
  stressed: [
    ["Despite stress, you kept journaling — that's emotional discipline", "You named your stressors specifically, which reduces their power", "You showed self-awareness about triggers and their effects"],
    ["You wrote through difficulty instead of avoiding it", "Your entries show honesty about your limits — that's wisdom", "Naming stress is the beginning of moving through it"],
  ],
  crisis: [
    ["You kept showing up for yourself even in a hard week", "Writing through pain is one of the most powerful things a person can do", "Your willingness to put words to difficulty is an act of self-care"],
    ["You didn't minimize what you were feeling — that honesty is healing", "Reaching for this space took courage — acknowledge that", "Your entries show someone who wants to understand themselves"],
  ],
}

const FOCUS: Record<Mood, string[]> = {
  happy: [
    "Capture what's creating this joy so you can return to it intentionally. What actions, people, or habits are feeding your happiness?",
    "Share some of this light with someone around you. Happiness shared deepens and extends.",
  ],
  gratitude: [
    "Try a 'three good things' practice each morning: just three specific moments you're grateful for before the day fills up.",
    "Write a short note of appreciation to one person who has supported you recently — even sending it silently counts.",
  ],
  calm: [
    "Protect whatever has been creating this stillness. Is it sleep? A walk? Fewer screens? Name it and guard it.",
    "Use this calm as a foundation — introduce one small challenge or creative project you've been putting off.",
  ],
  growth: [
    "Identify one concrete next step from this week's reflections. Growth without action stays in your head — where will yours land?",
    "Talk to someone whose perspective differs from yours. Growth accelerates at the edges of our comfort zone.",
  ],
  stressed: [
    "Choose one stressor to set down, even temporarily. Not forever — just for today. Which one weighs the most?",
    "Build one micro-recovery into tomorrow: a 5-minute walk, a real lunch break, or one conversation that has nothing to do with your worries.",
  ],
  crisis: [
    "If things feel unmanageable, please reach out to someone you trust or a support line. You don't have to carry this alone.",
    "Focus only on the next 24 hours. One small, gentle act of care for yourself — that's enough. Everything else can wait.",
  ],
}

function buildLocalInsight(moodCounts: MoodCounts, entryCount: number): LocalInsight {
  const sorted = Object.entries(moodCounts).sort(([, a], [, b]) => b - a) as [Mood, number][]
  const dominant = sorted[0]?.[0] ?? 'calm'
  const seed = entryCount % 2   // rotate between variations

  const summaryPool = SUMMARIES[dominant]
  const summary = summaryPool[seed % summaryPool.length]

  const highlightPool = HIGHLIGHTS[dominant]
  const highlights = highlightPool[seed % highlightPool.length]

  const focusPool = FOCUS[dominant]
  const suggested_focus = focusPool[seed % focusPool.length]

  return { summary, highlights, suggested_focus }
}

// ── Main component ─────────────────────────────────────────────────────────────
export function WeeklyInsightModal() {
  const { weeklyInsightOpen, closeWeeklyInsight, weeklyEntries, userId, streak, localEntries, entryCount } = useGameStore()
  const [apiSummary, setApiSummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState(false)

  // Fetch AI summary for logged-in users
  useEffect(() => {
    if (!weeklyInsightOpen || !userId) return
    setLoading(true)
    setRevealed(false)
    setApiSummary(null)
    fetch('/api/weekly-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: weeklyEntries || [], userId }),
    })
      .then((r) => r.json())
      .then((data) => { setApiSummary(data); setTimeout(() => setRevealed(true), 300) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [weeklyInsightOpen, userId, weeklyEntries])

  // Always reveal for guests (no loading state)
  useEffect(() => {
    if (!weeklyInsightOpen || userId) return
    setTimeout(() => setRevealed(true), 300)
  }, [weeklyInsightOpen, userId])

  // Build mood distribution from sources
  const moodCounts = useMemo<MoodCounts>(() => {
    const allEntries = [
      ...(weeklyEntries ?? []),
      ...localEntries.filter(e => {
        const entryDate = new Date(e.createdAt)
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
        return entryDate >= weekAgo
      }),
    ]
    const counts: MoodCounts = {}
    for (const e of allEntries) {
      counts[e.mood as Mood] = (counts[e.mood as Mood] ?? 0) + 1
    }
    return counts
  }, [weeklyEntries, localEntries])

  const totalMoodEntries = Object.values(moodCounts).reduce((a, b) => a + b, 0)
  const moodTags = Object.keys(moodCounts) as Mood[]

  // Use API summary if available, otherwise generate locally
  const summary: WeeklySummary | null = useMemo(() => {
    if (apiSummary) return apiSummary
    if (totalMoodEntries === 0) return null
    const local = buildLocalInsight(moodCounts, entryCount)
    return {
      summary: local.summary,
      highlights: local.highlights,
      suggested_focus: local.suggested_focus,
    } as WeeklySummary
  }, [apiSummary, moodCounts, totalMoodEntries, entryCount])

  const totalEntries = (weeklyEntries?.length ?? 0) + localEntries.length
  const moodOrder: Mood[] = ['happy', 'gratitude', 'calm', 'growth', 'stressed', 'crisis']
  const maxCount = Math.max(1, ...Object.values(moodCounts))

  return (
    <GlassModal
      isOpen={weeklyInsightOpen}
      onClose={closeWeeklyInsight}
      title="🌾 Weekly Garden Insight"
      maxWidth="max-w-xl"
    >
      {loading ? (
        <div className="flex flex-col items-center py-8 gap-4">
          <div className="w-10 h-10 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Reflecting on your week...</p>
        </div>
      ) : summary ? (
        <div className={`space-y-5 transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          {/* Streak & Entries header */}
          <div className="flex gap-2 md:gap-3">
            <div className="flex-1 bg-amber-500/20 border border-amber-400/40 rounded-xl md:rounded-2xl p-2 md:p-4 flex flex-col items-center text-center shadow-inner">
              <span className="text-xl md:text-3xl mb-1">🔥</span>
              <p className="text-white font-bold text-base md:text-xl">{streak}</p>
              <p className="text-amber-100/80 text-[8px] md:text-[10px] font-semibold uppercase tracking-wider">Day Streak</p>
            </div>
            <div className="flex-1 bg-emerald-500/20 border border-emerald-400/40 rounded-xl md:rounded-2xl p-2 md:p-4 flex flex-col items-center text-center shadow-inner">
              <span className="text-xl md:text-3xl mb-1">📝</span>
              <p className="text-white font-bold text-base md:text-xl">{totalMoodEntries}</p>
              <p className="text-emerald-100/80 text-[8px] md:text-[10px] font-semibold uppercase tracking-wider">This Week</p>
            </div>
            <div className="flex-1 bg-indigo-500/20 border border-indigo-400/40 rounded-xl md:rounded-2xl p-2 md:p-4 flex flex-col items-center text-center shadow-inner">
              <span className="text-xl md:text-3xl mb-1">🌈</span>
              <p className="text-white font-bold text-base md:text-xl">{moodTags.length}</p>
              <p className="text-indigo-100/80 text-[8px] md:text-[10px] font-semibold uppercase tracking-wider">Moods Felt</p>
            </div>
          </div>

          {/* Mood distribution mini-bars */}
          {totalMoodEntries > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] uppercase tracking-widest mb-3">This Week&apos;s Mood Mix</p>
              <div className="space-y-2">
                {moodOrder.map((mood) => {
                  const count = moodCounts[mood] ?? 0
                  if (count === 0) return null
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <div key={mood} className="flex items-center gap-2">
                      <span className="text-base w-5 text-center">{MOOD_EMOJI[mood]}</span>
                      <span className="text-white/60 text-xs capitalize w-16 flex-shrink-0">{mood}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-white/50 text-xs w-4 text-right tabular-nums">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary narrative */}
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-5 border border-white/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <p className="text-white/90 text-sm leading-relaxed font-medium relative z-10">
              &ldquo;{summary.summary}&rdquo;
            </p>
          </div>

          {/* Highlights */}
          {summary.highlights.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] uppercase tracking-widest mb-3">✨ What stood out this week</p>
              <ul className="space-y-2.5">
                {summary.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-emerald-400 mt-0.5 flex-shrink-0 text-sm">✓</span>
                    <span className="text-white/80 text-sm leading-snug">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Focus for next week */}
          <div className="bg-white/8 border border-white/15 rounded-2xl p-4">
            <p className="text-white/50 text-[10px] uppercase tracking-widest mb-2">🌱 Focus for next week</p>
            <p className="text-white/85 text-sm leading-relaxed">{summary.suggested_focus}</p>
          </div>

          {/* Unlock badge */}
          {(totalEntries >= 7 || streak >= 7) && (
            <div className="bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-300/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 pointer-events-none" />
              <div className="w-12 h-12 bg-amber-400/30 rounded-full flex items-center justify-center text-3xl shadow-inner border border-amber-300/50 relative z-10 shrink-0">
                🏮
              </div>
              <div className="relative z-10">
                <p className="text-amber-50 font-bold text-sm uppercase tracking-wide">Mission Complete!</p>
                <p className="text-white font-medium text-sm">Lantern Decor Unlocked</p>
                <p className="text-white/70 text-xs mt-0.5">Your farm glows warmly at night now 🌙</p>
              </div>
            </div>
          )}

          <GlassButton onClick={closeWeeklyInsight} className="w-full font-bold text-base py-3">
            Back to Farm 🌾
          </GlassButton>
        </div>
      ) : (
        <div className="flex flex-col items-center py-10 gap-3">
          <span className="text-4xl animate-bounce">🌱</span>
          <p className="text-white/60 text-sm text-center px-4">
            Complete your first journal entry or mindfulness activity to unlock your Weekly Garden Insight!
          </p>
        </div>
      )}
    </GlassModal>
  )
}
