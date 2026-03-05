'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/gameStore'

const STEPS = [
    {
        emoji: '🌾',
        heading: 'Welcome to Mindful Farm',
        body: "Your personal sanctuary — grow crops, care for animals, and take care of yourself. You can move around freely right now!",
        hint: null,
        // Center-bottom on welcome
        position: 'bottom-center' as const,
    },
    {
        emoji: '🕹',
        heading: 'Moving Around',
        body: "Use WASD or Arrow Keys to walk. Hold Shift to run. Try it now!",
        hint: '⬆ ⬇ ⬅ ➡   or   W A S D',
        position: 'bottom-left' as const,
    },
    {
        emoji: '👋',
        heading: 'Interact with E',
        body: "Walk near an animal, NPC, or zone and press E. Try petting the cows in the top-left farm!",
        hint: 'Press  E  to interact',
        position: 'bottom-left' as const,
    },
    {
        emoji: '📖',
        heading: 'Journal House',
        body: "Head to the barn (top-right) to write reflections. Pick an emotion, write freely — a plant grows in your garden!",
        hint: 'Walk to the barn, press E',
        position: 'bottom-right' as const,
    },
    {
        emoji: '🦆',
        heading: 'Mindful Pond',
        body: "The duck pond (bottom-right) is for mindfulness — Box Breathing, Body Scan, or 5-Senses. No scores, just presence.",
        hint: '3 activities to explore',
        position: 'bottom-right' as const,
    },
    {
        emoji: '🔥',
        heading: 'Streaks & Rewards',
        body: "Return daily to build your streak! Unlock lanterns, fireflies, and more. Check Weekly Insight in the top HUD.",
        hint: null,
        position: 'bottom-center' as const,
    },
]

const positionStyles: Record<string, string> = {
    'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2',
    'bottom-left':   'fixed bottom-6 left-4',
    'bottom-right':  'fixed bottom-6 right-4',
}

export function TutorialOverlay() {
    const { hasSeenTutorial, setHasSeenTutorial, hasPickedAvatar } = useGameStore()
    const [step, setStep] = useState(0)

    if (hasSeenTutorial || !hasPickedAvatar) return null

    const current = STEPS[step]
    const isLast = step === STEPS.length - 1

    const handleNext = () => {
        if (isLast) setHasSeenTutorial(true)
        else setStep(s => s + 1)
    }

    return (
        // No backdrop — player can move and interact freely during tutorial
        <div className={`${positionStyles[current.position]} z-[999] pointer-events-auto w-72`}>
            <div
                className="flex flex-col gap-3 rounded-2xl p-5"
                style={{
                    background: 'rgba(14, 22, 38, 0.92)',
                    backdropFilter: 'blur(20px)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                }}
            >
                {/* Step dots */}
                <div className="flex gap-1.5 justify-center">
                    {STEPS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setStep(i)}
                            className={`rounded-full transition-all ${i === step ? 'w-5 h-1.5 bg-white' : i < step ? 'w-1.5 h-1.5 bg-white/40' : 'w-1.5 h-1.5 bg-white/15'}`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{current.emoji}</span>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-white text-sm font-bold leading-tight">{current.heading}</h2>
                        <p className="text-white/70 text-xs leading-relaxed">{current.body}</p>
                        {current.hint && (
                            <div className="mt-1 px-3 py-1 rounded-lg text-[10px] font-mono text-white/80 tracking-wider"
                                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                {current.hint}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={() => setHasSeenTutorial(true)}
                        className="text-white/30 hover:text-white/60 text-xs transition-colors"
                    >
                        Skip all
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 py-2 rounded-xl text-white font-bold text-xs transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #6abf69, #4caf50)', boxShadow: '0 2px 12px rgba(76,175,80,0.35)' }}
                    >
                        {isLast ? 'Got it!' : `Next (${step + 1}/${STEPS.length})`}
                    </button>
                </div>
            </div>
        </div>
    )
}
