'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

type InputDirection = 'up' | 'down' | 'left' | 'right' | null

export function MobileControls() {
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    // Fire event helpers
    const fireDir = useCallback((dir: InputDirection, isDown: boolean) => {
        window.dispatchEvent(new CustomEvent('mobile-input', { detail: { type: 'dir', dir, isDown } }))
    }, [])

    const fireInt = useCallback((isDown: boolean) => {
        window.dispatchEvent(new CustomEvent('mobile-input', { detail: { type: 'interact', isDown } }))
    }, [])

    // Disable context menu on long press
    useEffect(() => {
        const prevent = (e: Event) => e.preventDefault()
        document.addEventListener('contextmenu', prevent)
        return () => document.removeEventListener('contextmenu', prevent)
    }, [])

    if (!isTouchDevice) return null

    const btnBase = "absolute w-12 h-12 bg-black/30 backdrop-blur-md rounded-xl border border-white/20 shadow-xl flex items-center justify-center text-white/70 font-bold pointer-events-auto active:bg-white/30 active:scale-95 transition-all text-xl select-none touch-none"

    return (
        <div className="absolute inset-x-0 bottom-6 z-40 flex justify-between items-end px-6 pointer-events-none md:hidden">

            {/* ── 4-WAY CROSS BUTTONS ── */}
            <div className="relative w-36 h-36">
                {/* Up */}
                <button
                    className={`${btnBase} top-0 left-12`}
                    onPointerDown={(e) => { e.preventDefault(); fireDir('up', true) }}
                    onPointerUp={(e) => { e.preventDefault(); fireDir('up', false) }}
                    onPointerOut={(e) => { e.preventDefault(); fireDir('up', false) }}
                    onPointerCancel={(e) => { e.preventDefault(); fireDir('up', false) }}
                >▲</button>
                {/* Down */}
                <button
                    className={`${btnBase} bottom-0 left-12`}
                    onPointerDown={(e) => { e.preventDefault(); fireDir('down', true) }}
                    onPointerUp={(e) => { e.preventDefault(); fireDir('down', false) }}
                    onPointerOut={(e) => { e.preventDefault(); fireDir('down', false) }}
                    onPointerCancel={(e) => { e.preventDefault(); fireDir('down', false) }}
                >▼</button>
                {/* Left */}
                <button
                    className={`${btnBase} top-12 left-0`}
                    onPointerDown={(e) => { e.preventDefault(); fireDir('left', true) }}
                    onPointerUp={(e) => { e.preventDefault(); fireDir('left', false) }}
                    onPointerOut={(e) => { e.preventDefault(); fireDir('left', false) }}
                    onPointerCancel={(e) => { e.preventDefault(); fireDir('left', false) }}
                >◀</button>
                {/* Right */}
                <button
                    className={`${btnBase} top-12 right-0`}
                    onPointerDown={(e) => { e.preventDefault(); fireDir('right', true) }}
                    onPointerUp={(e) => { e.preventDefault(); fireDir('right', false) }}
                    onPointerOut={(e) => { e.preventDefault(); fireDir('right', false) }}
                    onPointerCancel={(e) => { e.preventDefault(); fireDir('right', false) }}
                >▶</button>
                {/* Center dot */}
                <div className="absolute top-12 left-12 w-12 h-12 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white/10" />
                </div>
            </div>

            {/* ── INTERACT BUTTON ── */}
            <button
                className="w-[72px] h-[72px] rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white font-bold text-lg pointer-events-auto active:scale-95 active:bg-white/30 transition-all shadow-xl select-none touch-none mr-2 mb-4"
                onPointerDown={(e) => { e.preventDefault(); fireInt(true) }}
                onPointerUp={(e) => { e.preventDefault(); fireInt(false) }}
                onPointerOut={(e) => { e.preventDefault(); fireInt(false) }}
                onPointerCancel={(e) => { e.preventDefault(); fireInt(false) }}
            >
                Tap
            </button>

        </div>
    )
}
