'use client'

import { useGameStore } from '@/lib/gameStore'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { MOOD_EMOJI } from '@/lib/types'

const INTERACTABLE_LABELS: Record<string, string> = {
  journal_house: 'Journal House — Press E to write',
  pond: 'Peaceful Pond — Press E to breathe',
  garden: 'Garden — Press E to plant',
  npc_guide: 'Guide — Press E to talk',
  npc_gardener: 'Gardener — Press E to talk',
  npc_neighbor: 'Neighbor — Press E to talk',
}

const WEATHER_EMOJI: Record<string, string> = {
  sunshine: '☀️',
  cloudy: '⛅',
  rainbow: '🌈',
  night: '🌙',
}

export function HUD() {
  const {
    lastMood,
    streak,
    weather,
    nearbyInteractable,
    questNotification,
    quests,
    weeklyInsightOpen,
    openWeeklyInsight,
    entryCount,
  } = useGameStore()

  const activeQuests = quests.filter((q) => q.status === 'active').slice(0, 3)
  const showWeeklyButton = entryCount >= 7 && !weeklyInsightOpen

  return (
    <>
      {/* Top-left: mood + streak */}
      <div className="absolute top-4 left-4 z-10">
        <GlassPanel className="px-3 py-2 flex items-center gap-2">
          <span className="text-xl">
            {lastMood ? MOOD_EMOJI[lastMood] : '🌱'}
          </span>
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-white/80">streak</span>
              <span className="text-sm font-bold text-cream-200">{streak}</span>
              <span className="text-xs">🔥</span>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Top-right: weather + time */}
      <div className="absolute top-4 right-4 z-10">
        <GlassPanel className="px-3 py-2 flex items-center gap-2">
          <span className="text-xl">{WEATHER_EMOJI[weather] || '☀️'}</span>
          <span className="text-xs text-white/80">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </GlassPanel>
      </div>

      {/* Bottom-center: interaction hint */}
      {nearbyInteractable && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 animate-fadeIn">
          <GlassPanel className="px-4 py-2">
            <p className="text-sm text-white font-medium text-center">
              {INTERACTABLE_LABELS[nearbyInteractable] || 'Press E to interact'}
            </p>
          </GlassPanel>
        </div>
      )}

      {/* Bottom-right: quest tracker */}
      {activeQuests.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10">
          <GlassPanel className="p-3 min-w-48">
            <p className="text-xs font-bold text-white/80 mb-2 uppercase tracking-wide">Quests</p>
            <div className="flex flex-col gap-1.5">
              {activeQuests.map((q) => (
                <div key={q.quest_key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-white/50 bg-white/20 flex-shrink-0" />
                  <span className="text-xs text-white/90 capitalize">
                    {q.quest_key.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Weekly insight button */}
      {showWeeklyButton && (
        <div className="absolute bottom-4 left-4 z-10">
          <button
            onClick={() => openWeeklyInsight([])}
            className="backdrop-blur-md bg-lavender-400/60 border border-lavender-300/50 text-white
              px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:bg-lavender-400/80 transition-all
              animate-pulse-soft"
          >
            Weekly Insight
          </button>
        </div>
      )}

      {/* Quest notification toast */}
      {questNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 animate-slideUp">
          <GlassPanel className="px-5 py-3 bg-sage-400/40">
            <p className="text-sm text-white font-medium text-center max-w-xs">
              {questNotification}
            </p>
          </GlassPanel>
        </div>
      )}

      {/* J key hint (first time) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <GlassPanel className="px-3 py-1">
          <p className="text-xs text-white/60">J = Journal &nbsp;|&nbsp; WASD/Arrows = Move &nbsp;|&nbsp; E = Interact</p>
        </GlassPanel>
      </div>
    </>
  )
}
