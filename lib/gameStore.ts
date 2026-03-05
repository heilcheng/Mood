import { create } from 'zustand'
import type { Mood, Plant, Quest, WeatherState, JournalEntry, AvatarChoice } from './types'

interface GameStore {
  // User state
  userId: string | null
  avatar: AvatarChoice
  displayName: string | null

  // Garden state
  lastMood: Mood | null
  streak: number
  weather: WeatherState
  plants: Plant[]
  quests: Quest[]
  unlockedItems: string[]
  entryCount: number

  // UI state
  journalOpen: boolean
  breathingOpen: boolean
  weeklyInsightOpen: boolean
  weeklyEntries: JournalEntry[] | null
  nearbyInteractable: string | null
  lastAnalysis: {
    mood: Mood
    tone_color: string
    short_reflection_prompt: string
    tags: string[]
  } | null
  questNotification: string | null

  // Actions
  setUserId: (id: string | null) => void
  setAvatar: (avatar: AvatarChoice) => void
  setDisplayName: (name: string | null) => void
  setLastMood: (mood: Mood) => void
  setStreak: (streak: number) => void
  setWeather: (weather: WeatherState) => void
  setPlants: (plants: Plant[]) => void
  addPlant: (plant: Plant) => void
  setQuests: (quests: Quest[]) => void
  updateQuest: (questKey: string, progress: number, status: 'active' | 'completed') => void
  setUnlockedItems: (items: string[]) => void
  setEntryCount: (count: number) => void
  incrementEntryCount: () => void

  openJournal: () => void
  closeJournal: () => void
  openBreathing: () => void
  closeBreathing: () => void
  openWeeklyInsight: (entries: JournalEntry[]) => void
  closeWeeklyInsight: () => void
  setNearbyInteractable: (id: string | null) => void
  setLastAnalysis: (analysis: GameStore['lastAnalysis']) => void
  setQuestNotification: (msg: string | null) => void
}

export const useGameStore = create<GameStore>((set) => ({
  userId: null,
  avatar: 'farmer_girl',
  displayName: null,
  lastMood: null,
  streak: 0,
  weather: 'sunshine',
  plants: [],
  quests: [],
  unlockedItems: [],
  entryCount: 0,
  journalOpen: false,
  breathingOpen: false,
  weeklyInsightOpen: false,
  weeklyEntries: null,
  nearbyInteractable: null,
  lastAnalysis: null,
  questNotification: null,

  setUserId: (id) => set({ userId: id }),
  setAvatar: (avatar) => set({ avatar }),
  setDisplayName: (name) => set({ displayName: name }),
  setLastMood: (mood) => set({ lastMood: mood }),
  setStreak: (streak) => set({ streak }),
  setWeather: (weather) => set({ weather }),
  setPlants: (plants) => set({ plants }),
  addPlant: (plant) => set((s) => ({ plants: [...s.plants, plant] })),
  setQuests: (quests) => set({ quests }),
  updateQuest: (questKey, progress, status) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.quest_key === questKey ? { ...q, progress, status } : q
      ),
    })),
  setUnlockedItems: (items) => set({ unlockedItems: items }),
  setEntryCount: (count) => set({ entryCount: count }),
  incrementEntryCount: () => set((s) => ({ entryCount: s.entryCount + 1 })),

  openJournal: () => set({ journalOpen: true }),
  closeJournal: () => set({ journalOpen: false }),
  openBreathing: () => set({ breathingOpen: true }),
  closeBreathing: () => set({ breathingOpen: false }),
  openWeeklyInsight: (entries) => set({ weeklyInsightOpen: true, weeklyEntries: entries }),
  closeWeeklyInsight: () => set({ weeklyInsightOpen: false, weeklyEntries: null }),
  setNearbyInteractable: (id) => set({ nearbyInteractable: id }),
  setLastAnalysis: (analysis) => set({ lastAnalysis: analysis }),
  setQuestNotification: (msg) => set({ questNotification: msg }),
}))
