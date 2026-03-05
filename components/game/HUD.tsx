'use client'

import { useGameStore } from '@/lib/gameStore'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { MOOD_EMOJI, QUESTS } from '@/lib/types'

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
    openDailyRecord,
    openSettings,
    entryCount,
  } = useGameStore()

  const activeQuests = quests.filter((q) => q.status === 'active').slice(0, 3)
  const showWeeklyButton = entryCount >= 7 && !weeklyInsightOpen

  const questTargetMap = Object.fromEntries(QUESTS.map((q) => [q.key, q.target]))

  return (
    <>
      {/* Top-left: mood + streak + action icons */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
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
        <div className="flex gap-2">
          <button
            onClick={openDailyRecord}
            title="Daily Record"
            className="backdrop-blur-md bg-white/15 border border-white/25 text-white
              w-9 h-9 rounded-xl text-base flex items-center justify-center
              hover:bg-white/25 transition-all shadow-sm"
          >
            📅
          </button>
          {showWeeklyButton && (
            <button
              onClick={() => openWeeklyInsight([])}
              title="Weekly Insight"
              className="backdrop-blur-md bg-lavender-400/60 border border-lavender-300/50 text-white
                w-9 h-9 rounded-xl text-base flex items-center justify-center
                hover:bg-lavender-400/80 transition-all shadow-sm animate-pulse-soft"
            >
              📊
            </button>
          )}
          <button
            onClick={openSettings}
            title="Settings"
            className="backdrop-blur-md bg-white/15 border border-white/25 text-white
              w-9 h-9 rounded-xl text-base flex items-center justify-center
              hover:bg-white/25 transition-all shadow-sm"
          >
            ⚙️
          </button>
        </div>
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
          <GlassPanel className="p-3 min-w-52">
            <p className="text-xs font-bold text-white/80 mb-2 uppercase tracking-wide">Quests</p>
            <div className="flex flex-col gap-2">
              {activeQuests.map((q) => {
                const target = questTargetMap[q.quest_key] ?? 1
                const progress = Math.min(q.progress, target)
                const pct = target > 0 ? (progress / target) * 100 : 0
                return (
                  <div key={q.quest_key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-white/90 capitalize">
                        {q.quest_key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-white/50 tabular-nums flex-shrink-0">
                        {progress} / {target}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400/70 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassPanel>
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
