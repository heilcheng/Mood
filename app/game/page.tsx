'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GameCanvas } from '@/components/game/GameCanvas'
import { HUD } from '@/components/game/HUD'
import { JournalModal } from '@/components/game/JournalModal'
import { BreathingOverlay } from '@/components/game/BreathingOverlay'
import { WeeklyInsightModal } from '@/components/game/WeeklyInsightModal'
import { createClient } from '@/lib/supabase'
import { useGameStore } from '@/lib/gameStore'
import { GardenSystem } from '@/game/systems/GardenSystem'
import { EventBridge } from '@/game/EventBridge'

export default function GamePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const {
    setUserId,
    setPlants,
    setQuests,
    setStreak,
    setWeather,
    setUnlockedItems,
    setEntryCount,
    setAvatar,
    weeklyInsightOpen,
    openWeeklyInsight,
    unlockedItems,
  } = useGameStore()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Allow guest mode — no DB operations
        setLoading(false)
        return
      }

      const userId = session.user.id
      setUserId(userId)

      try {
        // Load garden state, plants, quests in parallel
        const [gardenRes, plantsRes, questsRes, profileRes, entriesRes] = await Promise.all([
          fetch(`/api/analyze?action=gardenState&userId=${userId}`).then(r => r.ok ? r.json() : null).catch(() => null),
          supabase.from('plants').select('*').eq('user_id', userId).order('planted_at'),
          supabase.from('quests').select('*').eq('user_id', userId),
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('journal_entries').select('id').eq('user_id', userId),
        ])

        // Apply garden state
        if (gardenRes) {
          setStreak(gardenRes.streak || 0)
          setWeather(gardenRes.weather_state || 'sunshine')
          setUnlockedItems(gardenRes.unlocked_items || [])

          // Check growth boost
          if (gardenRes.last_active) {
            const lastActive = new Date(gardenRes.last_active)
            const boost = GardenSystem.computeGrowthBoost(lastActive)
            if (boost > 0) {
              setTimeout(() => EventBridge.emit('growthBoost', undefined as unknown as void), 3000)
            }
          }

          // Update last_active
          await supabase
            .from('garden_state')
            .update({ last_active: new Date().toISOString() })
            .eq('user_id', userId)
        }

        // Plants
        if (plantsRes.data) setPlants(plantsRes.data)

        // Quests — initialize defaults if none exist
        if (questsRes.data && questsRes.data.length > 0) {
          setQuests(questsRes.data)
        } else {
          // Initialize default quests
          const { QUESTS } = await import('@/lib/types')
          const defaultQuests = QUESTS.map(q => ({
            user_id: userId,
            quest_key: q.key,
            status: 'active' as const,
            progress: 0,
            updated_at: new Date().toISOString(),
          }))
          await supabase.from('quests').insert(defaultQuests)
          const freshQuests = defaultQuests.map((q, i) => ({ ...q, id: `tmp_${i}` }))
          setQuests(freshQuests as Parameters<typeof setQuests>[0])
        }

        // Avatar from profile
        if (profileRes.data?.avatar_choice) {
          setAvatar(profileRes.data.avatar_choice)
        }

        // Entry count
        if (entriesRes.data) {
          setEntryCount(entriesRes.data.length)
        }
      } catch (err) {
        console.error('Game init error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-200 to-sage-200 gap-6">
        <div className="text-6xl animate-float">🌱</div>
        <p className="text-sage-700 text-lg font-semibold">Preparing your farm...</p>
        <div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sage-200">
      {/* Phaser game canvas */}
      <GameCanvas />

      {/* Glass UI overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          <HUD />
        </div>
      </div>

      {/* Modals (pointer events handled individually) */}
      <JournalModal />
      <BreathingOverlay />
      <WeeklyInsightModal />

      {/* Back to menu */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10
          text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        Menu
      </button>
    </div>
  )
}
