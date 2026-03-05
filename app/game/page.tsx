'use client'

import { useEffect, useState } from 'react'
import { GameCanvas } from '@/components/game/GameCanvas'
import { HUD } from '@/components/game/HUD'
import { JournalModal } from '@/components/game/JournalModal'
import { BreathingOverlay } from '@/components/game/BreathingOverlay'
import { WeeklyInsightModal } from '@/components/game/WeeklyInsightModal'
import { DailyRecordModal } from '@/components/game/DailyRecordModal'
import { TutorialOverlay } from '@/components/game/TutorialOverlay'
import { AvatarPickerOverlay } from '@/components/game/AvatarPickerOverlay'
import { DialogOverlay } from '@/components/game/DialogOverlay'
import { SettingsModal } from '@/components/menu/SettingsModal'
import { MobileControls } from '@/components/game/MobileControls'
import { createClient, isSupabaseConfigured } from '@/lib/supabase'
import { useGameStore } from '@/lib/gameStore'
import { GardenSystem } from '@/game/systems/GardenSystem'
import { EventBridge } from '@/game/EventBridge'
import { QUESTS } from '@/lib/types'

function buildDefaultQuests(userId: string) {
  return QUESTS.map((q, i) => ({
    id: `local_${i}`,
    user_id: userId,
    quest_key: q.key,
    status: 'active' as const,
    progress: 0,
    updated_at: new Date().toISOString(),
  }))
}

export default function GamePage() {
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
    settingsOpen,
    closeSettings,
  } = useGameStore()

  useEffect(() => {
    const init = async () => {
      // Guest / no-Supabase path — skip all DB work
      if (!isSupabaseConfigured()) {
        const guestId = 'guest'
        setUserId(guestId)
        setQuests(buildDefaultQuests(guestId))
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Not signed in but Supabase is configured — still allow guest play
        const guestId = 'guest'
        setUserId(guestId)
        setQuests(buildDefaultQuests(guestId))
        setLoading(false)
        return
      }

      const userId = session.user.id
      setUserId(userId)

      try {
        const [gardenRes, plantsRes, questsRes, profileRes, entriesRes] = await Promise.all([
          fetch(`/api/analyze?action=gardenState&userId=${userId}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          supabase.from('plants').select('*').eq('user_id', userId).order('planted_at'),
          supabase.from('quests').select('*').eq('user_id', userId),
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('journal_entries').select('id').eq('user_id', userId),
        ])

        if (gardenRes) {
          setStreak(gardenRes.streak || 0)
          setWeather(gardenRes.weather_state || 'sunshine')
          setUnlockedItems(gardenRes.unlocked_items || [])
          if (gardenRes.last_active) {
            const boost = GardenSystem.computeGrowthBoost(new Date(gardenRes.last_active))
            if (boost > 0) setTimeout(() => EventBridge.emit('growthBoost', undefined as unknown as void), 3000)
          }
          await supabase.from('garden_state').update({ last_active: new Date().toISOString() }).eq('user_id', userId)
        }

        if (plantsRes.data) setPlants(plantsRes.data)

        if (questsRes.data && questsRes.data.length > 0) {
          setQuests(questsRes.data)
        } else {
          const defaultQuests = QUESTS.map((q) => ({
            user_id: userId,
            quest_key: q.key,
            status: 'active' as const,
            progress: 0,
            updated_at: new Date().toISOString(),
          }))
          await supabase.from('quests').insert(defaultQuests)
          setQuests(defaultQuests.map((q, i) => ({ ...q, id: `tmp_${i}` })) as Parameters<typeof setQuests>[0])
        }

        if (profileRes.data?.avatar_choice) setAvatar(profileRes.data.avatar_choice)
        if (entriesRes.data) setEntryCount(entriesRes.data.length)
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
      <GameCanvas />

      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          <HUD />
        </div>
        {/* Overlays */}
        <JournalModal />
        <BreathingOverlay />
        <WeeklyInsightModal />
        <DailyRecordModal />
        <SettingsModal isOpen={settingsOpen} onClose={closeSettings} />
        <DialogOverlay />
        <MobileControls />

        {/* Avatar picker is shown first; tutorial appears after */}
        <AvatarPickerOverlay />
        <TutorialOverlay />
      </div>
    </div>
  )
}
