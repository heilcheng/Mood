'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { EventBridge } from '@/game/EventBridge'
import { AudioManager } from '@/lib/audioManager'

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<{ game: unknown; destroy: () => void } | null>(null)
  const {
    plants,
    avatar,
    unlockedItems,
    openJournal,
    openBreathing,
    setNearbyInteractable,
    setQuestNotification,
    updateQuest,
    quests,
    userSettings,
    weather,
  } = useGameStore()

  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    const initGame = async () => {
      const { createPhaserGame } = await import('@/game/PhaserGame')
      if (!mounted || !containerRef.current) return

      const instance = await createPhaserGame(containerRef.current, {
        plants,
        avatar,
        unlockedItems,
      })

      if (!mounted) {
        instance.destroy()
        return
      }

      gameRef.current = instance
      ;(window as unknown as Record<string, unknown>).PHASER_GAME = instance.game
    }

    initGame()

    return () => {
      mounted = false
      gameRef.current?.destroy()
      gameRef.current = null
      delete (window as unknown as Record<string, unknown>).PHASER_GAME
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start ambient audio on first mount (requires user interaction — browser allows it after click)
  useEffect(() => {
    const isNight = weather === 'night'
    AudioManager.setMusicVolume(userSettings.musicVolume ?? 70)
    AudioManager.setSfxVolume(userSettings.sfxVolume ?? 80)
    const startAudio = () => {
      AudioManager.startBgm(isNight)
      AudioManager.startAmbient(isNight)
      window.removeEventListener('pointerdown', startAudio)
    }
    window.addEventListener('pointerdown', startAudio)
    return () => window.removeEventListener('pointerdown', startAudio)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Wire EventBridge → Zustand + AudioManager SFX
  useEffect(() => {
    const cleanups = [
      EventBridge.on('openJournal', () => { openJournal(); AudioManager.playSfx('open') }),
      EventBridge.on('openBreathing', () => { openBreathing(); AudioManager.playSfx('open') }),
      EventBridge.on('nearbyInteractable', ({ id }) => setNearbyInteractable(id)),
      EventBridge.on('plantAdded', () => AudioManager.playSfx('chime')),
      EventBridge.on('talkNPC', ({ message }) => {
        setQuestNotification(message)
        setTimeout(() => setQuestNotification(null), 5000)
      }),
      EventBridge.on('questProgress', ({ questKey, progress, completed }) => {
        const quest = quests.find((q) => q.quest_key === questKey)
        if (!quest || quest.status === 'completed') return
        updateQuest(questKey, progress, completed ? 'completed' : 'active')
        if (completed) {
          AudioManager.playSfx('chime')
          setQuestNotification(`Quest complete: ${questKey.replace(/_/g, ' ')}`)
          setTimeout(() => setQuestNotification(null), 3000)
        }
      }),
    ]

    return () => cleanups.forEach((fn) => fn())
  }, [openJournal, openBreathing, setNearbyInteractable, setQuestNotification, updateQuest, quests])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
