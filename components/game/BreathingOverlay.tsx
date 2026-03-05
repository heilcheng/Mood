'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { EventBridge } from '@/game/EventBridge'
import { MOOD_TO_PLANT } from '@/lib/types'
import { AudioManager } from '@/lib/audioManager'

// ── Types ─────────────────────────────────────────────────────────────────────
type Activity = 'box_breathing' | 'body_scan' | 'five_senses'
type BoxPhase = 'ready' | 'inhale' | 'hold_in' | 'exhale' | 'hold_out' | 'done'

const BOX_PHASES: BoxPhase[] = ['inhale', 'hold_in', 'exhale', 'hold_out']
const PHASE_MS: Record<BoxPhase, number> = {
  ready: 0, inhale: 4000, hold_in: 4000, exhale: 4000, hold_out: 4000, done: 0,
}
const PHASE_LABEL: Record<BoxPhase, string> = {
  ready: '', inhale: 'Breathe In', hold_in: 'Hold', exhale: 'Breathe Out', hold_out: 'Hold', done: '',
}
const PHASE_COUNT: Record<BoxPhase, number> = {
  ready: 0, inhale: 4, hold_in: 4, exhale: 4, hold_out: 4, done: 0,
}
const TARGET_CYCLES = 3

// ── Body scan & 5-senses scripts ─────────────────────────────────────────────
const BODY_SCAN = [
  { emoji: '🦶', label: 'Feet & Toes', text: 'Feel the weight of your feet. Let them soften and melt into the ground.' },
  { emoji: '🦵', label: 'Legs & Knees', text: 'Scan upward through your calves. Allow every muscle to let go.' },
  { emoji: '🫀', label: 'Belly & Hips', text: 'Watch your belly rise and fall with each breath. Let this area be soft.' },
  { emoji: '🤍', label: 'Chest & Heart', text: 'Notice the gentle rhythm of your heartbeat. Breathe into the space around it.' },
  { emoji: '🤲', label: 'Arms & Hands', text: 'Let your arms feel heavy and warm. Relax each finger one by one.' },
  { emoji: '😌', label: 'Neck & Shoulders', text: 'Drop your shoulders away from your ears. Release everything held there.' },
  { emoji: '🧠', label: 'Face & Mind', text: 'Soften your jaw, your eyes, your brow. Let your mind be still — like a calm pond.' },
]

const SENSES = [
  { emoji: '👁️', count: 5, label: 'See', prompt: 'Name 5 things you can see right now.' },
  { emoji: '✋', count: 4, label: 'Feel', prompt: 'Notice 4 sensations — your weight, your breath, a texture.' },
  { emoji: '👂', count: 3, label: 'Hear', prompt: 'Listen for 3 distinct sounds in your environment.' },
  { emoji: '👃', count: 2, label: 'Smell', prompt: 'Take a slow breath. Notice 2 scents, even subtle ones.' },
  { emoji: '👅', count: 1, label: 'Taste', prompt: 'Be aware of 1 taste in your mouth. Simply notice.' },
]

const FEELINGS = [
  { emoji: '🌸', label: 'Peaceful', value: 'calm' },
  { emoji: '☀️', label: 'Uplifted', value: 'happy' },
  { emoji: '🌿', label: 'Grounded', value: 'gratitude' },
  { emoji: '☁️', label: 'Still heavy', value: 'stressed' },
  { emoji: '🌱', label: 'Curious', value: 'growth' },
]

const ACTIVITIES = [
  { key: 'box_breathing' as Activity, emoji: '🌬️', title: 'Box Breathing', sub: 'Calm your nervous system with a 4-4-4-4 breath rhythm.', dur: '~2 min' },
  { key: 'body_scan' as Activity, emoji: '🌊', title: 'Body Scan', sub: 'A gentle journey from head to toe, releasing held tension.', dur: '~3 min' },
  { key: 'five_senses' as Activity, emoji: '🌼', title: '5-4-3-2-1 Grounding', sub: 'Anchor yourself in the present moment using your senses.', dur: '~3 min' },
]

// ── Fancy breathing circle ────────────────────────────────────────────────────
const R = 90         // circle radius
const CX = 110       // svg center
const CIRCUMFERENCE = 2 * Math.PI * R

function BreathingCircle({
  phase,
  progress,
  countdown,
}: {
  phase: BoxPhase
  progress: number
  countdown: number
}) {
  const isExpanding = phase === 'inhale'
  const isHolding = phase === 'hold_in' || phase === 'hold_out'
  const isDone = phase === 'done'

  // Sphere scale: 0.55 at rest, 1.0 fully expanded
  const scale = isExpanding
    ? 0.55 + progress * 0.45
    : phase === 'exhale'
      ? 1.0 - progress * 0.45
      : phase === 'hold_in' ? 1.0
        : phase === 'hold_out' ? 0.55
          : 0.55

  // Ring dash-offset for counting circle
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  // Color theme per phase
  const colors = isDone
    ? { sphere: ['#a7f3d0', '#34d399'], ring: '#10b981', glow: '#34d39966' }
    : isExpanding
      ? { sphere: ['#c4b5fd', '#8b5cf6'], ring: '#8b5cf6', glow: '#8b5cf655' }
      : isHolding
        ? { sphere: phase === 'hold_in' ? ['#c4b5fd', '#7c3aed'] : ['#bae6fd', '#0ea5e9'], ring: phase === 'hold_in' ? '#7c3aed' : '#0ea5e9', glow: phase === 'hold_in' ? '#7c3aed44' : '#0ea5e944' }
        : { sphere: ['#bae6fd', '#0ea5e9'], ring: '#0ea5e9', glow: '#0ea5e955' }

  return (
    <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>

      {/* Outer ambient glow */}
      <div
        className="absolute rounded-full transition-all duration-1000"
        style={{
          width: 220 * scale + 40,
          height: 220 * scale + 40,
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          transition: `width ${PHASE_MS[phase]}ms ease-in-out, height ${PHASE_MS[phase]}ms ease-in-out`,
        }}
      />

      {/* SVG ring */}
      <svg
        width="220" height="220"
        viewBox="0 0 220 220"
        className="absolute top-0 left-0"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle cx={CX} cy={CX} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        {/* Animated dash ring */}
        <circle
          cx={CX} cy={CX} r={R}
          fill="none"
          stroke={colors.ring}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.6s ease' }}
        />
      </svg>

      {/* Sphere */}
      <div
        className="absolute rounded-full transition-all flex items-center justify-center"
        style={{
          width: 160 * scale,
          height: 160 * scale,
          background: `radial-gradient(circle at 35% 35%, ${colors.sphere[0]}, ${colors.sphere[1]})`,
          boxShadow: `0 0 40px ${colors.glow}, inset 0 -8px 20px rgba(0,0,0,0.2), inset 0 8px 20px rgba(255,255,255,0.25)`,
          transition: `width ${PHASE_MS[phase]}ms ease-in-out, height ${PHASE_MS[phase]}ms ease-in-out`,
        }}
      >
        {isDone
          ? <span className="text-white text-4xl select-none">✓</span>
          : phase !== 'ready' && (
            <span className="text-white text-4xl font-bold select-none tabular-nums" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
              {countdown}
            </span>
          )
        }
      </div>

      {/* Floating particles only while breathing */}
      {phase !== 'ready' && phase !== 'done' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-60 animate-float"
              style={{
                width: 4 + (i % 3),
                height: 4 + (i % 3),
                background: colors.ring,
                left: `${12 + (i * 11) % 76}%`,
                top: `${8 + (i * 13 + 5) % 80}%`,
                animationDelay: `${(i * 0.4) % 2.5}s`,
                animationDuration: `${2 + (i % 3) * 0.8}s`,
                filter: 'blur(0.5px)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Countdown tick helper ─────────────────────────────────────────────────────
function useCountdown(phaseDuration: number, progress: number, maxCount: number): number {
  return Math.max(1, Math.ceil(maxCount * (1 - progress)))
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function MiniBar({ progress, color = 'rgba(255,255,255,0.6)' }: { progress: number; color?: string }) {
  return (
    <div className="w-52 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
      <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: color, transition: 'width 0.1s linear' }} />
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function BreathingOverlay() {
  const {
    breathingOpen, closeBreathing, openJournal,
    setQuestNotification, userId, addPlant, plants, incrementEntryCount, streak,
    updateQuest, quests,
  } = useGameStore()

  const [stage, setStage] = useState<'select' | 'activity' | 'feeling' | 'reward'>('select')
  const [activity, setActivity] = useState<Activity>('box_breathing')

  // Box breathing
  const [phase, setPhase] = useState<BoxPhase>('ready')
  const [cycles, setCycles] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const phaseRef = useRef<BoxPhase>('ready')
  const cycleRef = useRef(0)
  const countdown = useCountdown(PHASE_MS[phase], phaseProgress, PHASE_COUNT[phase])

  // Step-based (body scan / senses)
  const [stepIndex, setStepIndex] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const STEP_MS = activity === 'body_scan' ? 18000 : 22000

  // Post-feeling
  const [feeling, setFeeling] = useState<string | null>(null)
  const [feelingText, setFeelingText] = useState('')
  const [plantName, setPlantName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (breathingOpen) {
      AudioManager.startMeditationMusic()
    } else {
      AudioManager.stopMeditationMusic()
    }
  }, [breathingOpen])

  const resetAll = useCallback(() => {
    setStage('select'); setPhase('ready')
    phaseRef.current = 'ready'; cycleRef.current = 0
    setCycles(0); setPhaseProgress(0); setStepIndex(0)
    setStepProgress(0); setFeeling(null); setFeelingText('')
    setPlantName(null)
  }, [])
  const handleClose = () => { resetAll(); closeBreathing() }

  // ── Box breathing tick ───────────────────────────────────────────────────────
  const nextBoxPhase = useCallback(() => {
    const cur = phaseRef.current
    const idx = BOX_PHASES.indexOf(cur)
    if (idx === -1) return
    const nextIdx = (idx + 1) % BOX_PHASES.length
    const next = BOX_PHASES[nextIdx]
    if (nextIdx === 0) {
      cycleRef.current += 1
      setCycles(cycleRef.current)
      if (cycleRef.current >= TARGET_CYCLES) {
        phaseRef.current = 'done'
        setPhase('done')
        setTimeout(() => setStage('feeling'), 1400)
        return
      }
    }
    phaseRef.current = next
    setPhase(next)
    setPhaseProgress(0)
  }, [])

  useEffect(() => {
    if (activity !== 'box_breathing' || phase === 'ready' || phase === 'done') return
    const dur = PHASE_MS[phase]
    const start = Date.now()
    let raf: number
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      setPhaseProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else nextBoxPhase()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, activity, nextBoxPhase])

  // ── Step tick ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'activity' || activity === 'box_breathing') return
    setStepProgress(0)
    const start = Date.now()
    let raf: number
    const tick = () => {
      setStepProgress(Math.min((Date.now() - start) / STEP_MS, 1))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stepIndex, stage, activity, STEP_MS])

  const steps = activity === 'body_scan' ? BODY_SCAN : SENSES
  const handleNextStep = () =>
    stepIndex < steps.length - 1 ? setStepIndex(s => s + 1) : setStage('feeling')

  // ── Submit feeling ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!feeling || submitting) return
    setSubmitting(true)
    try {
      const text = feelingText.trim()
        ? `After mindfulness I feel ${feeling}. ${feelingText}`
        : `After my mindfulness practice I feel ${feeling}.`

      const res = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId, overrideMood: feeling }),
      })
      const data = await res.json()

      const plantType = MOOD_TO_PLANT[data.mood as keyof typeof MOOD_TO_PLANT]
      if (plantType && userId) {
        const { GardenSystem } = await import('@/game/systems/GardenSystem')
        const pos = GardenSystem.getNextPlotPosition(plants)
        if (pos) {
          const pRes = await fetch('/api/analyze', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text, userId, savePlant: true, tileX: pos.x, tileY: pos.y,
              plantType, mood: data.mood, confidence: data.confidence,
              tags: data.tags, shortPrompt: data.short_reflection_prompt,
            }),
          })
          const { plant } = await pRes.json().catch(() => ({ plant: null }))
          if (plant) { addPlant(plant); EventBridge.emit('plantAdded', plant) }
        }
      }
      incrementEntryCount()
      const calmQ = quests.find(q => q.quest_key === 'calm_minute')
      if (calmQ && calmQ.status !== 'completed') {
        updateQuest('calm_minute', 1, 'completed')
      }
      setPlantName(plantType || 'seed')
      setStage('reward')
      setQuestNotification('Quest: A Calm Minute — complete!')
      setTimeout(() => setQuestNotification(null), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (!breathingOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-auto">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08001f] via-[#1a0050] to-[#001030] opacity-95" />

      {/* Star field */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute rounded-full animate-pulse-soft"
            style={{
              width: 1 + (i % 2),
              height: 1 + (i % 2),
              background: 'white',
              top: `${(i * 19 + 3) % 95}%`,
              left: `${(i * 23 + 7) % 97}%`,
              opacity: 0.2 + (i % 5) * 0.1,
              animationDelay: `${(i * 0.3) % 4}s`,
            }} />
        ))}
      </div>

      {/* Close */}
      <button onClick={handleClose}
        className="absolute top-6 right-6 z-10 text-white/40 hover:text-white/80 text-sm transition-all px-4 py-2 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
        ✕ Close
      </button>

      <div className="relative w-full max-w-md mx-4 flex flex-col items-center">

        {/* ══ SELECT ═══════════════════════════════════════════════════════════ */}
        {stage === 'select' && (
          <div className="flex flex-col items-center gap-6 py-6 w-full animate-fadeIn">
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-2">Mindful Moment</p>
              <h2 className="text-white text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Choose an activity</h2>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {ACTIVITIES.map(a => (
                <button key={a.key}
                  onClick={() => { setActivity(a.key); setStage('activity'); setStepIndex(0); setStepProgress(0) }}
                  className="flex items-start gap-4 w-full rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-98"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
                  <span className="text-3xl">{a.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-bold text-base">{a.title}</p>
                      <span className="text-white/35 text-xs">{a.dur}</span>
                    </div>
                    <p className="text-white/60 text-sm mt-1 leading-relaxed">{a.sub}</p>
                  </div>
                  <span className="text-white/25 text-lg self-center">›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ BOX BREATHING ════════════════════════════════════════════════════ */}
        {stage === 'activity' && activity === 'box_breathing' && (
          <div className="flex flex-col items-center gap-8 py-8 animate-fadeIn">
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-1">Box Breathing</p>
              {phase !== 'ready' && phase !== 'done' && (
                <p className="text-white/60 text-sm">Cycle {cycles + 1} of {TARGET_CYCLES}</p>
              )}
            </div>

            {phase === 'ready' ? (
              <>
                <BreathingCircle phase="ready" progress={0} countdown={4} />
                <p className="text-white/70 text-sm text-center max-w-[260px] leading-relaxed">
                  Inhale for 4 &nbsp;·&nbsp; Hold for 4 &nbsp;·&nbsp; Exhale for 4 &nbsp;·&nbsp; Hold for 4<br />
                  We will do <strong>{TARGET_CYCLES} cycles</strong> together.
                </p>
                <button onClick={() => { phaseRef.current = 'inhale'; cycleRef.current = 0; setCycles(0); setPhase('inhale'); setPhaseProgress(0) }}
                  className="px-12 py-4 rounded-2xl text-white text-lg font-bold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 6px 28px rgba(139,92,246,0.5)' }}>
                  Begin
                </button>
              </>
            ) : phase === 'done' ? (
              <>
                <BreathingCircle phase="done" progress={1} countdown={0} />
                <p className="text-white text-xl font-medium">Beautifully done 🌙</p>
              </>
            ) : (
              <>
                <BreathingCircle phase={phase} progress={phaseProgress} countdown={countdown} />
                <p className="text-white text-2xl font-semibold tracking-wide" style={{ textShadow: '0 2px 20px rgba(255,255,255,0.2)' }}>
                  {PHASE_LABEL[phase]}
                </p>
                <MiniBar progress={phaseProgress} />
              </>
            )}
          </div>
        )}

        {/* ══ BODY SCAN / 5 SENSES ════════════════════════════════════════════ */}
        {stage === 'activity' && activity !== 'box_breathing' && (
          <div className="flex flex-col items-center gap-6 py-6 w-full animate-fadeIn">
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-1">
                {activity === 'body_scan' ? 'Body Scan' : '5-4-3-2-1 Grounding'}
              </p>
              <p className="text-white/50 text-sm">Step {stepIndex + 1} of {steps.length}</p>
            </div>

            {/* Step dots */}
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div key={i} className="rounded-full transition-all"
                  style={{ width: i === stepIndex ? 20 : 8, height: 8, background: i <= stepIndex ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)', transition: 'all 0.3s ease' }} />
              ))}
            </div>

            {/* Card */}
            <div className="w-full rounded-3xl p-8 text-center flex flex-col items-center gap-4"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-4xl"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {steps[stepIndex].emoji}
              </div>

              {'count' in steps[stepIndex] && (
                <div className="flex gap-2">
                  {Array.from({ length: (steps[stepIndex] as typeof SENSES[0]).count }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-white/60" />
                  ))}
                </div>
              )}

              <p className="text-white font-semibold text-lg">{steps[stepIndex].label}</p>
              <p className="text-white/80 text-base leading-relaxed">
                {(steps[stepIndex] as { text?: string; prompt?: string }).text ||
                  (steps[stepIndex] as { prompt?: string }).prompt}
              </p>
            </div>

            <MiniBar progress={stepProgress} />

            <button onClick={handleNextStep}
              className="px-10 py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {stepIndex < steps.length - 1 ? 'Continue →' : 'Complete ✓'}
            </button>
          </div>
        )}

        {/* ══ FEELING CHECK-IN ════════════════════════════════════════════════ */}
        {stage === 'feeling' && (
          <div className="flex flex-col items-center gap-6 py-8 w-full animate-slideUpFade">
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-2">Check In</p>
              <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>How do you feel now?</h2>
              <p className="text-white/60 text-sm mt-2">Take a breath and notice.</p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {FEELINGS.map(f => (
                <button key={f.value} onClick={() => setFeeling(f.value)}
                  className="flex flex-col items-center gap-1.5 px-5 py-4 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: feeling === f.value ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)',
                    border: feeling === f.value ? '2px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.12)',
                    transform: feeling === f.value ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: feeling === f.value ? '0 0 24px rgba(255,255,255,0.12)' : 'none',
                  }}>
                  <span className="text-3xl">{f.emoji}</span>
                  <span className="text-white text-xs font-semibold">{f.label}</span>
                </button>
              ))}
            </div>

            <textarea
              value={feelingText}
              onChange={e => setFeelingText(e.target.value)}
              placeholder="Any thoughts you'd like to capture? (optional)"
              rows={3}
              className="w-full rounded-2xl px-5 py-4 text-white placeholder-white/30 text-sm resize-none focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}
            />

            <button onClick={handleSubmit} disabled={!feeling || submitting}
              className="w-full py-4 rounded-2xl text-white text-lg font-bold transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #34d399, #059669)', boxShadow: '0 6px 24px rgba(52,211,153,0.35)' }}>
              {submitting ? 'Planting…' : '🌱 Plant This Feeling'}
            </button>

            <button onClick={handleClose} className="text-white/30 hover:text-white/60 text-sm transition-colors">
              Skip & return to farm
            </button>
          </div>
        )}

        {/* ══ REWARD ══════════════════════════════════════════════════════════ */}
        {stage === 'reward' && (
          <div className="flex flex-col items-center gap-6 py-10 animate-slideUpFade text-center">
            {/* Glow orb */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: 'rgba(52,211,153,0.4)', transform: 'scale(1.5)' }} />
              <div className="relative w-24 h-24 rounded-full flex items-center justify-center text-5xl border-2 border-emerald-400/50"
                style={{ background: 'rgba(52,211,153,0.2)' }}>
                🌱
              </div>
            </div>

            <div>
              <h2 className="text-white text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Your Garden Grows</h2>
              <p className="text-white/70 text-base mt-3 leading-relaxed max-w-xs mx-auto">
                A <span className="font-bold text-emerald-300 uppercase tracking-widest">{plantName}</span> was planted in your farm to mark this moment of calm.
              </p>
            </div>

            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl"
              style={{ background: 'rgba(255,165,0,0.15)', border: '1px solid rgba(255,165,0,0.3)' }}>
              <span className="text-2xl">🔥</span>
              <span className="text-white/80 text-sm font-semibold">{streak} day streak — keep it going!</span>
            </div>

            <button
              onClick={() => { handleClose(); openJournal() }}
              className="w-full py-3 rounded-2xl text-white text-base font-semibold transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', maxWidth: 340 }}>
              Journal your experience 📝
            </button>

            <button onClick={handleClose}
              className="w-full py-4 rounded-2xl text-white text-xl font-bold transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #34d399, #059669)', boxShadow: '0 6px 24px rgba(52,211,153,0.4)', maxWidth: 340 }}>
              Return to Farm 🌾
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
