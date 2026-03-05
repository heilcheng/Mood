'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { EventBridge } from '@/game/EventBridge'

type DialogNode = {
    text: string
    choices?: { label: string; nextNode: string }[]
    action?: 'close' | 'quest'
}

type NPCDialog = Record<string, DialogNode>

// Hand-written conversations for each NPC
const DIALOGS: Record<string, NPCDialog> = {
    guide: {
        start: {
            text: "Welcome to Mindful Farm. It's so good to see you here.",
            choices: [
                { label: "What is this place?", nextNode: 'explain' },
                { label: "I just want to relax.", nextNode: 'relax' }
            ]
        },
        explain: {
            text: "This is a space just for you. Visit the barn to journal your feelings, or sit by the pond to practice breathing. Both will help your garden grow.",
            action: 'close'
        },
        relax: {
            text: "Then you're in exactly the right spot. Take your time. There's no rush here.",
            action: 'close'
        }
    },
    gardener: {
        start: {
            text: "Ah, hello there! Taking a moment to breathe the fresh air?",
            choices: [
                { label: "Yes, it's nice.", nextNode: 'nice' },
                { label: "Actually, my mind is full.", nextNode: 'full' }
            ]
        },
        nice: {
            text: "Isn't it? Every time you write down your feelings in the barn, I'll help you plant a new seed. Honesty makes the best fertilizer.",
            action: 'close'
        },
        full: {
            text: "That happens to the best of us. Why not walk down to the duck pond? A few minutes of quiet breathing can clear the clouds away.",
            action: 'close'
        }
    },
    neighbor: {
        start: {
            text: "Well hey. Don't see many new faces around this quiet corner.",
            choices: [
                { label: "How long have you been here?", nextNode: 'long' },
                { label: "Just enjoying the view.", nextNode: 'view' }
            ]
        },
        long: {
            text: "Oh, seasons on top of seasons. The secret to a good farm—and a good life—is just showing up, even on the cloudy days. You'll see.",
            action: 'close'
        },
        view: {
            text: "It's a good view. Best enjoyed slowly. See you around.",
            action: 'close'
        }
    }
}

const NPC_NAMES: Record<string, string> = {
    guide: 'River (Guide)',
    gardener: 'Fern (Gardener)',
    neighbor: 'Silas (Neighbor)'
}

export function DialogOverlay() {
    const [npcId, setNpcId] = useState<string | null>(null)
    const [currentNode, setCurrentNode] = useState<string>('start')
    const [displayedText, setDisplayedText] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const { setQuestNotification } = useGameStore()

    const textIndexRef = useRef(0)
    const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Listen for talk events from Phaser
    useEffect(() => {
        const cleanup = EventBridge.on('talkNPC', ({ npcId }) => {
            // Phaser sends the generic message, but we override it with our branching dialog
            if (DIALOGS[npcId]) {
                setNpcId(npcId)
                setCurrentNode('start')
            }
        })
        return cleanup
    }, [])

    // Typewriter effect
    useEffect(() => {
        if (!npcId) return
        const dialog = DIALOGS[npcId]?.[currentNode]
        if (!dialog) return

        setDisplayedText('')
        setIsTyping(true)
        textIndexRef.current = 0

        if (typeTimerRef.current) clearInterval(typeTimerRef.current)

        typeTimerRef.current = setInterval(() => {
            textIndexRef.current += 1
            setDisplayedText(dialog.text.slice(0, textIndexRef.current))

            if (textIndexRef.current >= dialog.text.length) {
                setIsTyping(false)
                if (typeTimerRef.current) clearInterval(typeTimerRef.current)
            }
        }, 25) // Typing speed

        return () => {
            if (typeTimerRef.current) clearInterval(typeTimerRef.current)
        }
    }, [npcId, currentNode])

    const handleNext = (nextNode?: string, action?: string) => {
        if (action === 'close') {
            closeDialog()
            return
        }
        if (nextNode) {
            setCurrentNode(nextNode)
        } else {
            closeDialog()
        }
    }

    const closeDialog = () => {
        setNpcId(null)
        setCurrentNode('start')

        // Resume Phaser input handling (handled via GameStore or globally)
        const phaserInstance = (window as any).PHASER_GAME as Phaser.Game
        if (phaserInstance && phaserInstance.input.keyboard) {
            phaserInstance.input.keyboard.enabled = true
        }
    }

    // Disable Phaser keyboard while dialog is open to prevent walking
    useEffect(() => {
        const phaserInstance = (window as any).PHASER_GAME as Phaser.Game
        if (phaserInstance && phaserInstance.input.keyboard) {
            phaserInstance.input.keyboard.enabled = !npcId

            // Also stop current movement
            if (npcId) {
                const scene = phaserInstance.scene.getScene('FarmScene') as any
                if (scene && scene.player) {
                    scene.player.body.setVelocity(0, 0)
                    scene.player.playAnim('idle', scene.player.getFacing())
                }
            }
        }
    }, [npcId])

    if (!npcId) return null

    const d = DIALOGS[npcId]?.[currentNode]
    if (!d) return null

    const isComplete = !isTyping

    return (
        <div className="fixed inset-0 z-[800] flex items-end justify-center pb-12 px-6 pointer-events-none">

            {/* Click-to-skip typing overlay */}
            {isTyping && (
                <div
                    className="absolute inset-0 pointer-events-auto cursor-pointer"
                    onClick={() => {
                        if (typeTimerRef.current) clearInterval(typeTimerRef.current)
                        setDisplayedText(d.text)
                        setIsTyping(false)
                    }}
                />
            )}

            {/* Main Dialog Box */}
            <div
                className="relative w-full max-w-2xl pointer-events-auto rounded-[32px] p-8 animate-slideUpFade shadow-2xl"
                style={{
                    background: 'rgba(250, 246, 237, 0.95)',
                    border: '4px solid #8b7355',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.5)'
                }}
            >
                {/* Name tag */}
                <div
                    className="absolute -top-7 left-10 rounded-2xl px-6 py-2 shadow-sm font-bold text-[#fdfbf7] tracking-wider"
                    style={{ background: '#6e5a40', border: '3px solid #fdfbf7' }}
                >
                    {NPC_NAMES[npcId] || 'Villager'}
                </div>

                {/* Text body */}
                <div className="min-h-[90px] pt-4">
                    <p className="text-2xl font-semibold text-[#4a3e2e] leading-relaxed">
                        {displayedText}
                    </p>
                </div>

                {/* Choices / Continue */}
                {isComplete && (
                    <div className="mt-8 flex flex-col gap-3 items-end animate-fadeIn">
                        {d.choices ? (
                            d.choices.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleNext(c.nextNode)}
                                    className="px-6 py-3 rounded-xl bg-[#e3d8c5] hover:bg-[#d4c5a9] text-[#4a3e2e] font-bold text-lg border-2 border-[#bfae91] active:scale-95 transition-all w-full sm:w-auto text-left"
                                >
                                    {c.label}
                                </button>
                            ))
                        ) : (
                            <button
                                onClick={() => handleNext(undefined, d.action || 'close')}
                                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#8b7355] text-white hover:bg-[#6e5a40] font-bold text-lg active:scale-95 transition-all animate-pulse-soft"
                            >
                                Continue
                                <span className="text-xl">▼</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
