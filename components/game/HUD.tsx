'use client'

import { useGameStore } from '@/lib/gameStore'
import { MOOD_EMOJI, QUESTS } from '@/lib/types'

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
    openDailyRecord,
    openSettings,
    entryCount,
  } = useGameStore()

  const activeQuests = quests.filter((q) => q.status === 'active').slice(0, 3)
  const showWeeklyButton = entryCount >= 7 && !weeklyInsightOpen
  const questTargetMap = Object.fromEntries(QUESTS.map((q) => [q.key, q.target]))

  return (
    <>
      {/* Top-left: mood + streak + icon buttons */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-black/40 border border-white/20 rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2"
          style={{ backdropFilter: 'blur(16px)' }}>
          <span className="text-xl">
            {lastMood ? MOOD_EMOJI[lastMood] : '🌱'}
          </span>
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-white/60">streak</span>
              <span className="text-sm font-bold text-white/90">{streak}</span>
              <span className="text-xs">🔥</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={openDailyRecord}
            title="Daily Record"
            className="bg-black/40 border border-white/20 shadow-xl text-base
              w-9 h-9 rounded-xl flex items-center justify-center
              hover:bg-white/10 transition-all"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            📅
          </button>
          {showWeeklyButton && (
            <button
              onClick={() => openWeeklyInsight([])}
              title="Weekly Insight"
              className="bg-black/40 border border-white/30 shadow-xl text-base
                w-9 h-9 rounded-xl flex items-center justify-center
                hover:bg-white/10 transition-all animate-pulse-soft"
              style={{ backdropFilter: 'blur(16px)' }}
            >
              📊
            </button>
          )}
          <button
            onClick={openSettings}
            title="Settings"
            className="bg-black/40 border border-white/20 shadow-xl text-base
              w-9 h-9 rounded-xl flex items-center justify-center
              hover:bg-white/10 transition-all"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Top-right: weather + time */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/40 border border-white/20 rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2"
          style={{ backdropFilter: 'blur(16px)' }}>
          <span className="text-xl">{WEATHER_EMOJI[weather] || '☀️'}</span>
          <span className="text-sm font-semibold text-white/90">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Bottom-center: interaction hint */}
      {nearbyInteractable && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 animate-fadeIn">
          <div className="bg-black/50 border border-white/20 rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3"
            style={{ backdropFilter: 'blur(16px)' }}>
            <span className="bg-white/20 text-white text-sm font-black px-2 py-1 rounded-lg border border-white/30 shadow">
              E
            </span>
            <p className="text-white/90 font-bold text-base">
              {INTERACTABLE_LABELS[nearbyInteractable] || 'Interact'}
            </p>
          </div>
        </div>
      )}

      {/* Bottom-right: quest tracker with progress */}
      {activeQuests.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-black/40 border border-white/20 rounded-2xl shadow-xl p-3 min-w-52">
            <p className="text-sm font-bold text-white/90 mb-2 uppercase tracking-wide">Quests</p>
            <div className="flex flex-col gap-2">
              {activeQuests.map((q) => {
                const target = questTargetMap[q.quest_key] ?? 1
                const progress = Math.min(q.progress, target)
                const pct = target > 0 ? (progress / target) * 100 : 0
                return (
                  <div key={q.quest_key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs flex-shrink-0">🌿</span>
                        <span className="text-sm text-white/70 capitalize">
                          {q.quest_key.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-white/50 tabular-nums flex-shrink-0">
                        {progress} / {target}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/60 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quest notification toast */}
      {questNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 animate-slideUp">
          <div className="bg-black/50 border border-white/20 rounded-2xl shadow-xl px-5 py-3"
            style={{ backdropFilter: 'blur(16px)' }}>
            <p className="text-sm text-white/90 font-medium text-center max-w-xs">
              {questNotification}
            </p>
          </div>
        </div>
      )}

      {/* Controls hint — bottom pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-black/40 border border-white/15 rounded-full shadow px-4 py-1"
          style={{ backdropFilter: 'blur(12px)' }}>
          <p className="text-sm text-white/60 font-medium">J = Journal &nbsp;|&nbsp; WASD/Arrows = Move &nbsp;|&nbsp; E = Interact</p>
        </div>
      </div>
    </>
  )
}
