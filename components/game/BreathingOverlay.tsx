'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { MOOD_TO_PLANT } from '@/lib/types'
import type { Mood } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────
type Activity = 'box_breathing' | 'body_scan' | 'five_senses' | 'breathing_478' | 'loving_kindness'
type Stage = 'select' | 'intro' | 'activity' | 'feeling' | 'reward'
type BoxPhase = 'ready' | 'inhale' | 'hold_in' | 'exhale' | 'hold_out' | 'done'

// ── SVG Icons (Replacing Emojis) ─────────────────────────────────────────────
const Icons = {
  BoxBreath: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  BodyScan: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  Senses: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Breath478: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
}

// ── Activity Definitions ─────────────────────────────────────────────────────
const ACTIVITIES = [
  { key: 'box_breathing' as Activity, Icon: Icons.BoxBreath, title: 'Box Breathing', sub: 'Calm your nervous system (4-4-4-4 rhythm)', dur: '2 min', color: 'from-blue-500 to-indigo-500' },
  { key: 'breathing_478' as Activity, Icon: Icons.Breath478, title: 'Relaxation Breath', sub: 'Deep rest and anxiety relief (4-7-8 rhythm)', dur: '3 min', color: 'from-indigo-500 to-purple-500' },
  { key: 'body_scan' as Activity, Icon: Icons.BodyScan, title: 'Body Scan', sub: 'Release held physical tension head to toe', dur: '4 min', color: 'from-teal-500 to-emerald-500' },
  { key: 'five_senses' as Activity, Icon: Icons.Senses, title: 'Grounding', sub: 'Anchor in the present using your senses', dur: '3 min', color: 'from-amber-500 to-orange-500' },
  { key: 'loving_kindness' as Activity, Icon: Icons.Heart, title: 'Kindness', sub: 'Cultivate compassion for self and others', dur: '3 min', color: 'from-rose-500 to-pink-500' },
]

// ── Scripts ──────────────────────────────────────────────────────────────────
const BODY_SCAN = [
  { label: 'Feet & Toes', hint: 'Breathe out through your soles', text: 'Feel the weight of your feet. Let them soften and melt into the ground.' },
  { label: 'Legs & Knees', hint: 'Release the calves and thighs', text: 'Scan upward through your legs. Allow every muscle to simply let go.' },
  { label: 'Belly & Hips', hint: 'Take a deep breath into the belly', text: 'Watch your center rise and fall with each breath. Let this area be soft.' },
  { label: 'Chest & Heart', hint: 'Feel the ribs expand', text: 'Notice the gentle rhythm of your heartbeat. Breathe into the space around it.' },
  { label: 'Arms & Hands', hint: 'Let the fingers uncurl', text: 'Let your arms feel heavy and warm. Relax each finger, one by one.' },
  { label: 'Neck & Shoulders', hint: 'Drop shoulders away from ears', text: 'Release the burdens held here. Let your shoulders sink downward.' },
  { label: 'Face & Mind', hint: 'Soften the jaw and brow', text: 'Relax your eyes. Let your mind be still, resting exactly as it is.' },
]

const SENSES = [
  { count: 5, label: 'See', sense: 'Sight', prompt: 'Acknowledge 5 things you can see right now.' },
  { count: 4, label: 'Feel', sense: 'Touch', prompt: 'Notice 4 sensations — your weight, temperature, textures.' },
  { count: 3, label: 'Hear', sense: 'Sound', prompt: 'Listen for 3 distinct sounds in your environment.' },
  { count: 2, label: 'Smell', sense: 'Scent', prompt: 'Take a breath. Notice 2 subtle scents around you.' },
  { count: 1, label: 'Taste', sense: 'Taste', prompt: 'Be aware of 1 taste in your mouth. Simply notice.' },
]

const LOVING_KINDNESS = [
  { target: 'Yourself', text: 'May I be happy. May I be well. May I feel safe. May I live with ease.' },
  { target: 'Someone you love', text: 'May you be happy. May you be well. May you feel safe. May you live with ease.' },
  { target: 'Someone neutral', text: 'May you be happy. May you be well. May you feel safe. May you live with ease.' },
  { target: 'All beings', text: 'May all beings be happy. May all beings be well. May all beings be free from suffering.' },
]

// ── Components ───────────────────────────────────────────────────────────────
function Background() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
      <div className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(45, 212, 191, 0.3) 0%, transparent 50%)',
          animation: 'pulse 15s ease-in-out infinite alternate',
        }}
      />
      {/* Stars layer 1 */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-moveBgSlow" />
    </div>
  )
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-2 justify-center my-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${i < current ? 'w-6 bg-white' : i === current ? 'w-4 bg-white/50' : 'w-1.5 bg-white/20'}`} />
      ))}
    </div>
  )
}

function BreathingSphere({ phase, text, progress, color }: { phase: string, text: string, progress: number, color: string }) {
  const isExpand = phase.includes('inhale')
  const isHoldIn = phase.includes('hold_in')
  // scale ranges from 0.6 (rest) to 1.1 (full)
  const scale = isExpand ? 0.6 + (progress * 0.5) : phase.includes('exhale') ? 1.1 - (progress * 0.5) : isHoldIn ? 1.1 : 0.6

  return (
    <div className="relative w-64 h-64 flex items-center justify-center mx-auto my-12">
      {/* Outer ripples */}
      <div className="absolute inset-0 rounded-full border border-white/10" style={{ transform: `scale(${scale * 1.4})`, transition: 'transform 0.1s linear' }} />
      <div className="absolute inset-0 rounded-full border border-white/20" style={{ transform: `scale(${scale * 1.2})`, transition: 'transform 0.1s linear' }} />
      {/* Main sphere */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${color} blur-sm opacity-50 transition-transform duration-100 ease-linear`}
        style={{ transform: `scale(${scale})` }}
      />
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${color} shadow-2xl transition-transform duration-100 ease-linear flex items-center justify-center text-center p-6`}
        style={{ transform: `scale(${scale})`, boxShadow: 'inset 0 0 40px rgba(255,255,255,0.2)' }}
      >
        <span className="text-white text-xl font-medium tracking-widest uppercase transition-opacity duration-500 ease-in-out">
          {text}
        </span>
      </div>
    </div>
  )
}

// ── Main Content ─────────────────────────────────────────────────────────────
export function BreathingOverlay() {
  const {
    breathingOpen, closeBreathing, userId, incrementEntryCount,
    addLocalEntry, setLastBreathDate, quests, updateQuest,
    setQuestNotification, streak, openJournal, lastJournalDate
  } = useGameStore()

  const [stage, setStage] = useState<Stage>('select')
  const [activity, setActivity] = useState<Activity | null>(null)

  // Activity state
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<BoxPhase>('ready')
  const [startTime, setStartTime] = useState(0)
  const [now, setNow] = useState(0)

  // Feeling state
  const [mood, setMood] = useState<Mood | null>(null)
  const [note, setNote] = useState('')

  // Cycles config
  const totalCycles = activity === 'breathing_478' ? 2 : streak >= 5 ? 4 : 3

  // Reset entirely when closed
  useEffect(() => {
    if (!breathingOpen) {
      setStage('select')
      setActivity(null)
      setMood(null)
      setNote('')
      setStep(0)
    }
  }, [breathingOpen])

  // Timeloop for breathing
  useEffect(() => {
    if (stage !== 'activity' || !activity?.includes('breathing')) return
    let raf: number
    const loop = (time: number) => { setNow(time); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [stage, activity])

  // Breathing logic
  useEffect(() => {
    if (stage !== 'activity') return
    // Box Breathing (4-4-4-4)
    if (activity === 'box_breathing') {
      const pms = { ready: 0, inhale: 4000, hold_in: 4000, exhale: 4000, hold_out: 4000, done: 0 }
      const total = 16000
      const elapsed = now - startTime
      if (now === 0) return
      if (elapsed > total * totalCycles) { setStage('feeling'); return }
      const cTime = elapsed % total
      if (cTime < pms.inhale) setPhase('inhale')
      else if (cTime < pms.inhale + pms.hold_in) setPhase('hold_in')
      else if (cTime < pms.inhale + pms.hold_in + pms.exhale) setPhase('exhale')
      else setPhase('hold_out')
    }
    // 4-7-8 Breathing
    else if (activity === 'breathing_478') {
      const pms = { ready: 0, inhale: 4000, hold_in: 7000, exhale: 8000, hold_out: 0, done: 0 }
      const total = 19000
      const elapsed = now - startTime
      if (now === 0) return
      if (elapsed > total * totalCycles) { setStage('feeling'); return }
      const cTime = elapsed % total
      if (cTime < pms.inhale) setPhase('inhale')
      else if (cTime < pms.inhale + pms.hold_in) setPhase('hold_in')
      else setPhase('exhale')
    }
  }, [now, stage, activity, startTime, totalCycles])

  // Body Scan / Loving Kindness auto-advance
  useEffect(() => {
    if (stage !== 'activity') return
    if (activity === 'body_scan') {
      if (step >= BODY_SCAN.length) { setStage('feeling'); return }
      const t = setTimeout(() => setStep(s => s + 1), 10000) // 10s per body part
      return () => clearTimeout(t)
    }
    if (activity === 'loving_kindness') {
      if (step >= LOVING_KINDNESS.length) { setStage('feeling'); return }
      const t = setTimeout(() => setStep(s => s + 1), 12000) // 12s per phrase
      return () => clearTimeout(t)
    }
  }, [stage, activity, step])

  if (!breathingOpen) return null

  // Breathing progress calcs
  const isBox = activity === 'box_breathing'
  const is478 = activity === 'breathing_478'
  const phaseDur = isBox ? 4000 : (phase === 'inhale' ? 4000 : phase === 'hold_in' ? 7000 : 8000)
  const cycleTime = now - startTime
  const currentPhaseStart = isBox
    ? (phase === 'inhale' ? 0 : phase === 'hold_in' ? 4000 : phase === 'exhale' ? 8000 : 12000)
    : (phase === 'inhale' ? 0 : phase === 'hold_in' ? 4000 : 11000)
  const phaseProgress = Math.min(1, Math.max(0, ((cycleTime % (isBox ? 16000 : 19000)) - currentPhaseStart) / phaseDur))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans pointer-events-auto">
      <Background />

      <div className="relative z-10 w-full max-w-xl mx-auto px-6 h-full flex flex-col justify-center">

        {/* ── STAGE: SELECT ──────────────────────────────────────────────── */}
        {stage === 'select' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-10">
              <h2 className="text-3xl text-white font-light tracking-wide mb-3">Mindful Moment</h2>
              <p className="text-white/60 text-sm">Choose a practice to center yourself.</p>
            </div>
            <div className="space-y-3">
              {ACTIVITIES.map(a => (
                <button
                  key={a.key}
                  onClick={() => { setActivity(a.key); setStage('intro') }}
                  className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all text-left group"
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center text-white shadow-lg`}>
                    <a.Icon />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg tracking-wide">{a.title}</h3>
                    <p className="text-white/50 text-xs mt-0.5">{a.sub}</p>
                  </div>
                  <div className="text-white/30 text-xs font-medium tracking-widest uppercase group-hover:text-white/60 transition-colors">
                    {a.dur}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={closeBreathing} className="block mx-auto mt-8 text-white/40 hover:text-white/80 text-sm uppercase tracking-widest transition-colors">
              Return to Farm
            </button>
          </div>
        )}

        {/* ── STAGE: INTRO ────────────────────────────────────────────────── */}
        {stage === 'intro' && (
          <div className="text-center animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-8 pulse-slow">
              <span className="text-white/80">
                {(() => { const I = ACTIVITIES.find(x => x.key === activity)?.Icon; return I ? <I /> : null })()}
              </span>
            </div>
            <h2 className="text-2xl text-white font-light tracking-wide mb-4">Find a comfortable position</h2>
            <p className="text-white/50 mb-12 max-w-sm mx-auto">Soften your shoulders. Rest your hands. Gently close your eyes or soften your gaze.</p>
            <button
              onClick={() => {
                setStage('activity')
                setStartTime(performance.now())
                setPhase('inhale')
              }}
              className="px-8 py-3 rounded-full bg-white text-slate-900 font-medium tracking-wide hover:scale-105 transition-transform"
            >
              I am ready
            </button>
          </div>
        )}

        {/* ── STAGE: ACTIVITY ──────────────────────────────────────────────── */}
        {stage === 'activity' && (
          <div className="animate-fadeIn w-full">

            {/* Box Breathing & 4-7-8 */}
            {(isBox || is478) && (
              <div className="text-center">
                <p className="text-white/60 uppercase tracking-widest text-xs mb-8">
                  {isBox ? 'Box Breathing' : 'Relaxation Breath'}
                </p>
                <BreathingSphere
                  phase={phase}
                  progress={phaseProgress}
                  text={phase.replace('_in', '').replace('_out', '')}
                  color={isBox ? 'from-indigo-400 to-purple-400' : 'from-purple-400 to-rose-400'}
                />
                <ProgressDots total={totalCycles} current={Math.floor((now - startTime) / (isBox ? 16000 : 19000))} />
              </div>
            )}

            {/* Body Scan */}
            {activity === 'body_scan' && step < BODY_SCAN.length && (
              <div className="flex flex-col h-[60vh] justify-center items-center text-center">
                <p className="text-teal-400/80 uppercase tracking-widest text-xs font-semibold mb-6 flex items-center gap-2">
                  <Icons.BodyScan /> Area {step + 1} of 7
                </p>
                <h3 className="text-3xl text-white font-light tracking-wide mb-6 animate-slideUp">{BODY_SCAN[step].label}</h3>
                <p className="text-white/70 text-lg leading-relaxed max-w-md animate-slideUp" style={{ animationDelay: '0.2s' }}>{BODY_SCAN[step].text}</p>

                <div className="mt-16 w-full max-w-xs mx-auto">
                  <div className="h-0.5 bg-white/10 rounded-full w-full relative">
                    <div className="absolute top-0 left-0 h-full bg-teal-400 transition-all duration-1000" style={{ width: `${(step / 6) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* 5-4-3-2-1 Grounding */}
            {activity === 'five_senses' && step < SENSES.length && (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto border border-amber-500/30 bg-amber-500/10 rounded-full flex items-center justify-center mb-8 text-amber-400">
                  <span className="text-4xl font-light">{SENSES[step].count}</span>
                </div>
                <h3 className="text-2xl text-white font-light tracking-wide mb-4 capitalize">Things you can {SENSES[step].label}</h3>
                <p className="text-white/60 mb-12">{SENSES[step].prompt}</p>

                <div className="flex justify-center gap-3 mb-16">
                  {Array.from({ length: SENSES[step].count }).map((_, i) => (
                    <button key={i} className="w-12 h-12 rounded-full border border-white/20 hover:bg-white/10 hover:scale-105 transition-all focus:bg-amber-500/20 focus:border-amber-500/50" />
                  ))}
                </div>

                <button
                  onClick={() => { if (step < 4) setStep(s => s + 1); else setStage('feeling') }}
                  className="text-white/50 hover:text-white uppercase tracking-widest text-sm transition-colors"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Loving Kindness */}
            {activity === 'loving_kindness' && step < LOVING_KINDNESS.length && (
              <div className="text-center h-[50vh] flex flex-col justify-center animate-fadeIn relative">
                <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full" />
                <p className="text-rose-300 uppercase tracking-widest text-xs mb-8">{LOVING_KINDNESS[step].target}</p>
                <div className="space-y-6 text-2xl text-white/90 font-serif italic mx-auto max-w-lg">
                  {LOVING_KINDNESS[step].text.split('. ').map((s, i) => (
                    <p key={i} className="animate-slideUp" style={{ animationDelay: `${i * 1.5}s`, opacity: 0, animationFillMode: 'forwards' }}>
                      {s.replace('.', '')}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Skip / End Early Button */}
            <div className="absolute bottom-10 left-0 right-0text-center flex justify-center w-full">
              <button
                onClick={() => setStage('feeling')}
                className="text-white/30 hover:text-white/70 text-xs tracking-widest uppercase transition-colors px-4 py-2"
              >
                End practice early
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE: FEELING CHECK-IN ────────────────────────────────────────── */}
        {stage === 'feeling' && (
          <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl animate-scaleIn">
            <h2 className="text-2xl text-center text-white font-light mb-8 cursor-default">How do you feel now?</h2>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {(['calm', 'happy', 'gratitude', 'growth', 'stressed', 'crisis'] as Mood[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`py-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${mood === m ? 'bg-white/20 border-white/40 scale-105 shadow-xl' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <span className="text-white/80 font-medium text-sm capitalize">{m}</span>
                </button>
              ))}
            </div>

            <textarea
              placeholder="Any thoughts arising? (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 resize-none h-24 mb-6 focus:outline-none focus:border-white/30 transition-colors"
            />

            <button
              disabled={!mood}
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10)
                addLocalEntry({ mood: mood!, tags: [activity!], createdAt: new Date().toISOString(), source: 'mindfulness', note: note.trim() || undefined })
                incrementEntryCount()
                setLastBreathDate(today)

                // Cross-quests
                const brQ = quests.find(q => q.quest_key === 'breath_and_reflect')
                if (brQ && brQ.status !== 'completed') {
                  if (lastJournalDate === today) {
                    updateQuest('breath_and_reflect', 1, 'completed')
                    setQuestNotification('Quest complete: Mindful Cycle! 🧘‍♀️')
                    setTimeout(() => setQuestNotification(null), 3000)
                  }
                }
                const calmQ = quests.find(q => q.quest_key === 'calm_minute')
                if (calmQ && calmQ.status !== 'completed') {
                  updateQuest('calm_minute', 1, 'completed')
                  setQuestNotification('Quest complete: A Moment of Calm! ☁️')
                  setTimeout(() => setQuestNotification(null), 3000)
                }

                setStage('reward')
              }}
              className={`w-full py-4 rounded-xl text-lg tracking-wide transition-all ${mood ? 'bg-white text-slate-900 font-medium hover:bg-white/90' : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
            >
              Complete Practice
            </button>
          </div>
        )}

        {/* ── STAGE: REWARD ──────────────────────────────────────────────────── */}
        {stage === 'reward' && (
          <div className="text-center animate-fadeIn">
            <div className="text-6xl mb-6 animate-bounce select-none">
              {mood ? MOOD_TO_PLANT[mood] : '🌱'}
            </div>
            <h2 className="text-3xl text-white font-light mb-2">Well done.</h2>
            <p className="text-white/60 mb-12">You've nurtured your mind and your garden.</p>

            <div className="flex justify-center gap-4">
              <button
                onClick={closeBreathing}
                className="px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                Return to Farm
              </button>
              <button
                onClick={() => { closeBreathing(); setTimeout(openJournal, 500) }}
                className="px-8 py-3 rounded-full bg-white text-slate-900 font-medium hover:bg-white/90 transition-colors"
              >
                Journal Now
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
