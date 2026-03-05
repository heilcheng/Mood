'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

type InputDirection = 'up' | 'down' | 'left' | 'right' | null

export function MobileControls() {
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    const dpadRef = useRef<HTMLDivElement>(null)
    const interactRef = useRef<HTMLDivElement>(null)

    // Track active inputs to avoid spamming events if already held
    const activeDirs = useRef<Set<InputDirection>>(new Set())
    const interactHeld = useRef(false)

    // Detect touch capability
    useEffect(() => {
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }, [])

    // Dispatch custom events to window that Phaser systems will catch
    const dispatchKeyDir = useCallback((dir: InputDirection, isDown: boolean) => {
        window.dispatchEvent(
            new CustomEvent('mobile-input', {
                detail: { type: 'dir', dir, isDown },
            })
        )
    }, [])

    const dispatchInteract = useCallback((isDown: boolean) => {
        window.dispatchEvent(
            new CustomEvent('mobile-input', {
                detail: { type: 'interact', isDown },
            })
        )
    }, [])

    // ----- D-Pad Pointer Handling -----
    const handlePointerDpad = useCallback((e: PointerEvent) => {
        if (!dpadRef.current) return
        e.preventDefault() // prevent scrolling/default actions
        if (e.type === 'pointermove' && e.buttons !== 1) return // only track if mouse button is down

        const rect = dpadRef.current.getBoundingClientRect()
        // Calculate which direction is primarily being pressed based on pointer coordinates relative to dpad center
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2

        const newActive = new Set<InputDirection>()

        // If pointer is generally inside the D-pad area (generous bounds)
        if (e.clientX > rect.left - 40 && e.clientX < rect.right + 40 &&
            e.clientY > rect.top - 40 && e.clientY < rect.bottom + 40) {
            const dx = e.clientX - cx
            const dy = e.clientY - cy

            // Simple 4-way diagonal split
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 20) newActive.add('right')
                if (dx < -20) newActive.add('left')
            } else {
                if (dy > 20) newActive.add('down')
                if (dy < -20) newActive.add('up')
            }
        }

        // Fire keyUps for dirs no longer active
        for (const d of activeDirs.current) {
            if (!newActive.has(d)) dispatchKeyDir(d, false)
        }
        // Fire keyDowns for newly active dirs
        for (const d of newActive) {
            if (!activeDirs.current.has(d)) dispatchKeyDir(d, true)
        }
        activeDirs.current = newActive
    }, [dispatchKeyDir])

    const handlePointerEndDpad = useCallback((e: PointerEvent) => {
        e.preventDefault()
        for (const d of activeDirs.current) {
            dispatchKeyDir(d, false)
        }
        activeDirs.current.clear()
    }, [dispatchKeyDir])

    // ----- Interact Pointer Handling -----
    const handlePointerInteractStart = useCallback((e: PointerEvent) => {
        e.preventDefault()
        if (!interactHeld.current) {
            interactHeld.current = true
            dispatchInteract(true)
        }
    }, [dispatchInteract])

    const handlePointerInteractEnd = useCallback((e: PointerEvent) => {
        e.preventDefault()
        if (interactHeld.current) {
            interactHeld.current = false
            dispatchInteract(false)
        }
    }, [dispatchInteract])

    // Bind native pointer events so we can use preventDefault
    useEffect(() => {
        const dpad = dpadRef.current
        const interact = interactRef.current
        if (!dpad || !interact) return

        dpad.addEventListener('pointerdown', handlePointerDpad, { passive: false })
        dpad.addEventListener('pointermove', handlePointerDpad, { passive: false })
        dpad.addEventListener('pointerup', handlePointerEndDpad, { passive: false })
        dpad.addEventListener('pointercancel', handlePointerEndDpad, { passive: false })

        interact.addEventListener('pointerdown', handlePointerInteractStart, { passive: false })
        interact.addEventListener('pointerup', handlePointerInteractEnd, { passive: false })
        interact.addEventListener('pointercancel', handlePointerInteractEnd, { passive: false })
        interact.addEventListener('pointerout', handlePointerInteractEnd, { passive: false })

        return () => {
            dpad.removeEventListener('pointerdown', handlePointerDpad)
            dpad.removeEventListener('pointermove', handlePointerDpad)
            dpad.removeEventListener('pointerup', handlePointerEndDpad)
            dpad.removeEventListener('pointercancel', handlePointerEndDpad)

            interact.removeEventListener('pointerdown', handlePointerInteractStart)
            interact.removeEventListener('pointerup', handlePointerInteractEnd)
            interact.removeEventListener('pointercancel', handlePointerInteractEnd)
            interact.removeEventListener('pointerout', handlePointerInteractEnd)
        }
    }, [handlePointerDpad, handlePointerEndDpad, handlePointerInteractStart, handlePointerInteractEnd])

    if (!isTouchDevice) return null

    return (
        <div className="absolute inset-x-0 bottom-6 z-40 flex justify-between items-end px-6 pointer-events-none md:hidden">

            {/* ── D-PAD ── */}
            <div
                ref={dpadRef}
                className="relative w-36 h-36 bg-black/10 backdrop-blur-sm rounded-full border border-white/20 pointer-events-auto shadow-xl select-none touch-none overflow-hidden"
            >
                {/* Visual cross styling */}
                <div className="absolute inset-x-0 top-1/2 -mt-4 h-8 bg-white/5" />
                <div className="absolute inset-y-0 left-1/2 -ml-4 w-8 bg-white/5" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 shadow-inner" />
                </div>

                {/* Arrows */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/50 text-xl font-bold">▲</div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50 text-xl font-bold">▼</div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 text-xl font-bold">◀</div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 text-xl font-bold">▶</div>
            </div>

            {/* ── INTERACT BUTTON ── */}
            <div
                ref={interactRef}
                className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white font-bold text-xl pointer-events-auto active:scale-95 active:bg-white/30 transition-all shadow-xl select-none touch-none mr-2 mb-2"
            >
                Tap
            </div>

        </div>
    )
}
