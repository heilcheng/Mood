'use client'

import { useState } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { useGameStore } from '@/lib/gameStore'
import { QUESTS } from '@/lib/types'

export function QuestTracker() {
  const { quests } = useGameStore()
  const [collapsed, setCollapsed] = useState(false)

  const questsWithMeta = QUESTS.map((qDef) => {
    const progress = quests.find((q) => q.quest_key === qDef.key)
    return {
      ...qDef,
      progress: progress?.progress ?? 0,
      status: progress?.status ?? 'active',
    }
  })

  const active = questsWithMeta.filter((q) => q.status === 'active')
  const completed = questsWithMeta.filter((q) => q.status === 'completed')

  if (questsWithMeta.length === 0) return null

  return (
    <GlassPanel className="p-3 min-w-52">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full"
      >
        <span className="text-xs font-bold text-white/80 uppercase tracking-wide">
          Quests ({completed.length}/{QUESTS.length})
        </span>
        <span className="text-white/60 text-xs">{collapsed ? '▲' : '▼'}</span>
      </button>

      {!collapsed && (
        <div className="mt-2 space-y-2">
          {active.slice(0, 3).map((q) => (
            <div key={q.key} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white/40 bg-white/10 flex-shrink-0" />
                <span className="text-xs text-white/90 font-medium">{q.title}</span>
              </div>
              {q.target > 1 && (
                <div className="ml-5">
                  <div className="h-1 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage-400/80 rounded-full transition-all"
                      style={{ width: `${Math.min((q.progress / q.target) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{q.progress}/{q.target}</p>
                </div>
              )}
            </div>
          ))}

          {completed.length > 0 && (
            <div className="border-t border-white/10 pt-2 space-y-1">
              {completed.map((q) => (
                <div key={q.key} className="flex items-center gap-2">
                  <span className="text-sage-300 text-xs">✓</span>
                  <span className="text-xs text-white/40 line-through">{q.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  )
}
