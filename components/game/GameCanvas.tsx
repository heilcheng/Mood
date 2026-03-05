'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { EventBridge } from '@/game/EventBridge'

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

  // Wire EventBridge → Zustand
  useEffect(() => {
    const cleanups = [
      EventBridge.on('openJournal', () => openJournal()),
      EventBridge.on('openBreathing', () => openBreathing()),
      EventBridge.on('nearbyInteractable', ({ id }) => setNearbyInteractable(id)),
      EventBridge.on('talkNPC', ({ npcId, message }) => {
        // Show NPC message as quest notification briefly
        setQuestNotification(message)
        setTimeout(() => setQuestNotification(null), 5000)
      }),
      EventBridge.on('questProgress', ({ questKey, progress, completed }) => {
        const quest = quests.find((q) => q.quest_key === questKey)
        if (!quest || quest.status === 'completed') return
        updateQuest(questKey, progress, completed ? 'completed' : 'active')
        if (completed) {
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
