'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { GlassButton } from '@/components/ui/GlassButton'

type Phase = 'ready' | 'inhale' | 'hold_in' | 'exhale' | 'hold_out' | 'done'

const PHASE_DURATIONS: Record<Phase, number> = {
  ready: 0,
  inhale: 4000,
  hold_in: 2000,
  exhale: 4000,
  hold_out: 2000,
  done: 0,
}

const PHASE_LABELS: Record<Phase, string> = {
  ready: 'Get comfortable and press Start',
  inhale: 'Breathe in...',
  hold_in: 'Hold...',
  exhale: 'Breathe out...',
  hold_out: 'Hold...',
  done: 'Well done',
}

const PHASE_SIZES: Record<Phase, number> = {
  ready: 80,
  inhale: 140,
  hold_in: 140,
  exhale: 80,
  hold_out: 80,
  done: 100,
}

const CYCLE_ORDER: Phase[] = ['inhale', 'hold_in', 'exhale', 'hold_out']

export function BreathingOverlay() {
  const { breathingOpen, closeBreathing, setQuestNotification } = useGameStore()
  const [phase, setPhase] = useState<Phase>('ready')
  const [cycles, setCycles] = useState(0)
  const [score, setScore] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const phaseRef = useRef<Phase>('ready')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const cycleRef = useRef(0)
  const targetCycles = 3

  const nextPhase = useCallback(() => {
    const currentPhase = phaseRef.current
    const currentIndex = CYCLE_ORDER.indexOf(currentPhase)

    if (currentIndex === -1) return

    const nextIndex = (currentIndex + 1) % CYCLE_ORDER.length
    const next = CYCLE_ORDER[nextIndex]

    if (nextIndex === 0) {
      cycleRef.current += 1
      setCycles(cycleRef.current)

      if (cycleRef.current >= targetCycles) {
        phaseRef.current = 'done'
        setPhase('done')
        setScore(Math.floor(70 + Math.random() * 30))
        return
      }
    }

    phaseRef.current = next
    setPhase(next)
    setPhaseProgress(0)
  }, [])

  useEffect(() => {
    if (phase === 'ready' || phase === 'done') return

    const duration = PHASE_DURATIONS[phase]
    const start = Date.now()
    let rafId: number

    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setPhaseProgress(progress)

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        nextPhase()
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [phase, nextPhase])

  const handleStart = () => {
    phaseRef.current = 'inhale'
    setPhase('inhale')
    setCycles(0)
    cycleRef.current = 0
    setPhaseProgress(0)
  }

  const handleClose = () => {
    setPhase('ready')
    setCycles(0)
    setPhaseProgress(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    closeBreathing()
  }

  const handleDone = () => {
    setQuestNotification('Quest complete: A Calm Minute — breathing done!')
    setTimeout(() => setQuestNotification(null), 3000)
    handleClose()
  }

  if (!breathingOpen) return null

  const circleSize = PHASE_SIZES[phase]
  const pulseColor = phase === 'inhale' || phase === 'hold_in'
    ? '#a78bfa'
    : '#7dd3fc'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/80 via-purple-900/70 to-sky-900/80 backdrop-blur-md" />

      <div className="relative flex flex-col items-center gap-8 p-8">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute -top-4 right-0 text-white/50 hover:text-white text-sm"
        >
          Skip
        </button>

        {/* Title */}
        <h2 className="text-white text-2xl font-bold drop-shadow">Breathing Space</h2>

        {/* Breathing circle */}
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
          {/* Outer glow rings */}
          <div
            className="absolute rounded-full border-2 border-white/10 transition-all"
            style={{
              width: circleSize + 40,
              height: circleSize + 40,
              transitionDuration: `${PHASE_DURATIONS[phase]}ms`,
              transitionTimingFunction: 'ease-in-out',
            }}
          />
          <div
            className="absolute rounded-full border-2 border-white/20 transition-all"
            style={{
              width: circleSize + 20,
              height: circleSize + 20,
              transitionDuration: `${PHASE_DURATIONS[phase]}ms`,
              transitionTimingFunction: 'ease-in-out',
            }}
          />

          {/* Main circle */}
          <div
            className="rounded-full flex items-center justify-center transition-all"
            style={{
              width: circleSize,
              height: circleSize,
              backgroundColor: pulseColor,
              opacity: 0.8,
              transitionDuration: `${PHASE_DURATIONS[phase]}ms`,
              transitionTimingFunction: 'ease-in-out',
              boxShadow: `0 0 40px ${pulseColor}88`,
            }}
          >
            <span className="text-white text-3xl">
              {phase === 'done' ? '✓' : phase === 'ready' ? '🌿' : ''}
            </span>
          </div>
        </div>

        {/* Phase label */}
        <div className="text-center">
          <p className="text-white text-xl font-semibold">{PHASE_LABELS[phase]}</p>
          {phase !== 'ready' && phase !== 'done' && (
            <p className="text-white/60 text-sm mt-1">
              Cycle {cycles + 1} of {targetCycles}
            </p>
          )}
        </div>

        {/* Progress bar */}
        {phase !== 'ready' && phase !== 'done' && (
          <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full transition-all"
              style={{ width: `${phaseProgress * 100}%` }}
            />
          </div>
        )}

        {/* Actions */}
        {phase === 'ready' && (
          <GlassButton onClick={handleStart} size="lg">
            Begin
          </GlassButton>
        )}

        {phase === 'done' && (
          <div className="text-center space-y-4 animate-fadeIn">
            <p className="text-white/80 text-sm">Calmness score</p>
            <p className="text-4xl font-bold text-white">{score}</p>
            <p className="text-white/60 text-xs">You completed {targetCycles} cycles</p>
            <GlassButton onClick={handleDone}>Return to Farm</GlassButton>
          </div>
        )}
      </div>
    </div>
  )
}
