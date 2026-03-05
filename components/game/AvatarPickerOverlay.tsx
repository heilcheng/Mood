'use client'

import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { EventBridge } from '@/game/EventBridge'
import type { AvatarChoice } from '@/lib/types'

const AVATARS: Array<{
    key: AvatarChoice
    label: string
    role: string
    description: string
    sprite: string
    glow: string
    bg: string
}> = [
        {
            key: 'farmer_girl',
            label: 'Rose',
            role: 'The Gentle Gardener',
            description: 'Thoughtful & nurturing — a heart that grows with every reflection.',
            sprite: '/assets/CozyValley/Characters/-- Pre-assembled Characters/char1.png',
            glow: '255,143,171',
            bg: 'from-rose-500/30 to-pink-400/20',
        },
        {
            key: 'farmer_boy',
            label: 'Sol',
            role: 'The Calm Wanderer',
            description: 'Grounded & steady — finds peace in the rhythm of nature.',
            sprite: '/assets/CozyValley/Characters/-- Pre-assembled Characters/char3.png',
            glow: '126,184,247',
            bg: 'from-blue-500/30 to-sky-400/20',
        },
        {
            key: 'cow',
            label: 'Clovis',
            role: 'The Curious Spirit',
            description: 'Playful & free — brings joy and wonder to every pasture.',
            sprite: '/assets/CozyValley/Animals/Cow/Cow_blackwhite.png',
            glow: '247,192,126',
            bg: 'from-amber-500/30 to-orange-400/20',
        },
    ]

function PixelSprite({ src, size = 80 }: { src: string; size?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const img = new Image()
        img.src = src
        img.onload = () => {
            ctx.clearRect(0, 0, size, size)
            ctx.imageSmoothingEnabled = false

            // Assume frame 0 is the top-left 32x32 block for all characters/animals
            // We scale it up to the requested 'size' (e.g., 72x72)
            ctx.drawImage(img, 0, 0, 32, 32, 0, 0, size, size)
        }
    }, [src, size])
    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ imageRendering: 'pixelated', width: size, height: size }}
        />
    )
}

export function AvatarPickerOverlay() {
    const { avatar, setAvatar, hasPickedAvatar, setHasPickedAvatar } = useGameStore()
    const [selected, setSelected] = useState<AvatarChoice>(avatar)
    const [confirming, setConfirming] = useState(false)

    if (hasPickedAvatar) return null

    const selectedData = AVATARS.find(a => a.key === selected)!

    const handleConfirm = () => {
        setConfirming(true)
        setTimeout(() => {
            setAvatar(selected)
            setHasPickedAvatar(true)
            // Update Phaser game _initData immediately so FarmScene reads correct avatar
            // even if it starts after this event fires
            const phaserGame = (window as unknown as Record<string, unknown>).PHASER_GAME
            if (phaserGame) {
                const existing = (phaserGame as unknown as Record<string, unknown>)._initData as Record<string, unknown> | undefined
                ;(phaserGame as unknown as Record<string, unknown>)._initData = { ...(existing ?? {}), avatar: selected }
            }
            EventBridge.emit('avatarChanged', { avatar: selected })
        }, 600)
    }

    return (
        <div
            className={`fixed inset-0 z-[900] flex flex-col items-center justify-center transition-all duration-700 pointer-events-auto ${confirming ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
            style={{ background: 'rgba(8, 14, 28, 0.78)', backdropFilter: 'blur(18px)' }}
        >
            {/* Animated sparkles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full animate-float"
                        style={{
                            width: 3 + (i % 3),
                            height: 3 + (i % 3),
                            background: `rgba(${selectedData.glow},0.6)`,
                            top: `${5 + (i * 17 + i * 3) % 88}%`,
                            left: `${3 + (i * 13 + i * 7) % 94}%`,
                            animationDelay: `${(i * 0.37) % 3}s`,
                            animationDuration: `${2.5 + (i % 4) * 0.7}s`,
                            filter: `blur(${i % 3 === 0 ? 1 : 0}px)`,
                        }}
                    />
                ))}
            </div>

            <div className="relative flex flex-col items-center gap-8 px-5 w-full max-w-lg">

                {/* Header */}
                <div className="text-center animate-fadeIn">
                    <p className="text-white/50 text-xs uppercase tracking-[0.3em] mb-2 font-semibold">Welcome to Mindful Farm</p>
                    <h1 className="text-white text-4xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 30px rgba(255,255,255,0.12)' }}>
                        Who are you?
                    </h1>
                    <p className="text-white/60 text-base mt-2">Choose your companion for this journey.</p>
                </div>

                {/* Avatar row */}
                <div className="flex gap-4 w-full justify-center flex-wrap">
                    {AVATARS.map((a) => {
                        const isSelected = selected === a.key
                        return (
                            <button
                                key={a.key}
                                onClick={() => setSelected(a.key)}
                                className={`relative flex flex-col items-center gap-3 p-5 rounded-3xl transition-all duration-300 active:scale-95 ${isSelected ? 'scale-105' : 'scale-100 hover:scale-102'}`}
                                style={{
                                    background: isSelected
                                        ? `rgba(${a.glow}, 0.18)`
                                        : 'rgba(255,255,255,0.06)',
                                    border: isSelected
                                        ? `2px solid rgba(${a.glow}, 0.7)`
                                        : '1.5px solid rgba(255,255,255,0.12)',
                                    boxShadow: isSelected
                                        ? `0 0 40px rgba(${a.glow}, 0.25), 0 8px 32px rgba(0,0,0,0.3)`
                                        : '0 4px 20px rgba(0,0,0,0.2)',
                                    minWidth: 110,
                                    backdropFilter: 'blur(12px)',
                                }}
                            >
                                {/* Glow disc behind sprite */}
                                <div
                                    className="absolute rounded-full"
                                    style={{
                                        width: 60, height: 60,
                                        background: `radial-gradient(circle, rgba(${a.glow},0.35) 0%, transparent 70%)`,
                                        top: '50%', left: '50%',
                                        transform: 'translate(-50%, -65%)',
                                        transition: 'opacity 0.3s',
                                        opacity: isSelected ? 1 : 0,
                                    }}
                                />

                                <PixelSprite src={a.sprite} size={72} />

                                <div className="text-center">
                                    <p className="text-white font-bold text-base">{a.label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: `rgba(${a.glow},1)`, fontWeight: 600 }}>{a.role}</p>
                                </div>

                                {isSelected && (
                                    <div
                                        className="absolute top-3 right-3 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                                        style={{ background: `rgba(${a.glow},0.9)`, color: '#fff', boxShadow: `0 0 8px rgba(${a.glow},0.6)` }}
                                    >
                                        ✓
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Info card for selected */}
                <div
                    className="w-full rounded-2xl px-6 py-4 text-center transition-all duration-300"
                    style={{
                        background: `linear-gradient(135deg, rgba(${selectedData.glow},0.15), rgba(${selectedData.glow},0.07))`,
                        border: `1px solid rgba(${selectedData.glow},0.3)`,
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <p className="text-white/90 text-sm leading-relaxed">{selectedData.description}</p>
                </div>

                {/* Confirm button */}
                <button
                    onClick={handleConfirm}
                    className="w-full py-4 rounded-2xl text-white text-xl font-bold transition-all duration-200 active:scale-95"
                    style={{
                        background: `linear-gradient(135deg, rgba(${selectedData.glow},0.9), rgba(${selectedData.glow},0.6))`,
                        boxShadow: `0 6px 30px rgba(${selectedData.glow},0.4)`,
                        maxWidth: 360,
                    }}
                >
                    Enter as {selectedData.label} 🌾
                </button>

                <p className="text-white/25 text-xs">You can always change this later in settings.</p>
            </div>
        </div>
    )
}
