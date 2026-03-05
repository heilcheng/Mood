'use client'

import { useGameStore } from '@/lib/gameStore'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { MOOD_EMOJI } from '@/lib/types'

const INTERACTABLE_LABELS: Record<string, string> = {
  journal_house: 'Journal House — write a reflection',
  pond: 'Peaceful Pond — breathing exercise',
  garden: 'Garden — plant something',
  npc_guide: 'Guide — chat',
  npc_gardener: 'Gardener — chat',
  npc_neighbor: 'Neighbor — chat',
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
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2">
          <span className="text-xl">
            {lastMood ? MOOD_EMOJI[lastMood] : '🌱'}
          </span>
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-amber-900/80">streak</span>
              <span className="text-sm font-bold text-amber-900">{streak}</span>
              <span className="text-xs">🔥</span>
            </div>
          )}
        </div>
      </div>

      {/* Top-right: weather + time */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2">
          <span className="text-xl">{WEATHER_EMOJI[weather] || '☀️'}</span>
          <span className="text-sm font-semibold text-amber-900">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Bottom-center: interaction hint — amber dialog box */}
      {nearbyInteractable && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 animate-fadeIn">
          <div className="bg-amber-50/95 border-2 border-amber-300 rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3">
            <span className="bg-amber-400 text-white text-xs font-black px-2 py-1 rounded-lg border border-amber-500 shadow">
              E
            </span>
            <p className="text-amber-900 font-bold text-base">
              {INTERACTABLE_LABELS[nearbyInteractable] || 'Interact'}
            </p>
          </div>
        </div>
      )}

      {/* Bottom-right: quest tracker */}
      {activeQuests.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-emerald-800/70 border border-emerald-600/60 rounded-2xl shadow-xl p-3 min-w-48">
            <p className="text-sm font-bold text-emerald-100 mb-2 uppercase tracking-wide">Quests</p>
            <div className="flex flex-col gap-1.5">
              {activeQuests.map((q) => (
                <div key={q.quest_key} className="flex items-center gap-2">
                  <span className="text-xs flex-shrink-0">🌿</span>
                  <span className="text-sm text-emerald-50 capitalize">
                    {q.quest_key.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
          <div className="bg-emerald-700/90 border border-emerald-500/60 rounded-2xl shadow-xl px-5 py-3">
            <p className="text-sm text-emerald-50 font-medium text-center max-w-xs">
              {questNotification}
            </p>
          </div>
        </div>
      )}

      {/* Controls hint — bottom pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-full shadow px-4 py-1">
          <p className="text-sm text-amber-900/80 font-medium">J = Journal &nbsp;|&nbsp; WASD/Arrows = Move &nbsp;|&nbsp; E = Interact</p>
        </div>
      </div>
    </>
  )
}
