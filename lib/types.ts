export type Mood = 'happy' | 'gratitude' | 'calm' | 'stressed' | 'growth' | 'crisis'

export type PlantType = 'sunflower' | 'daisy' | 'lotus' | 'lavender' | 'oak_sapling'

export type WeatherState = 'sunshine' | 'cloudy' | 'rainbow' | 'night'

export type ToneColor = 'sunny' | 'warm' | 'soft_blue' | 'lavender' | 'fresh_green'

export type AvatarChoice = 'farmer_girl' | 'farmer_boy' | 'cow'

export interface AnalyzeResult {
  mood: Mood
  confidence: number
  tags: string[]
  short_reflection_prompt: string
  tone_color: ToneColor
}

export interface JournalEntry {
  id: string
  user_id: string
  created_at: string
  text: string
  mood: Mood
  confidence: number | null
  tags: string[] | null
  short_prompt: string | null
}

export interface Plant {
  id: string
  user_id: string
  tile_x: number
  tile_y: number
  plant_type: PlantType
  stage: number
  planted_at: string
  last_updated: string
}

export interface GardenState {
  user_id: string
  last_active: string
  streak: number
  weather_state: WeatherState
  unlocked_items: string[]
  growth_boost_until: string | null
}

export interface Quest {
  id: string
  user_id: string
  quest_key: string
  status: 'active' | 'completed'
  progress: number
  updated_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_choice: AvatarChoice
  created_at: string
}

export interface WeeklySummary {
  summary: string
  highlights: string[]
  suggested_focus: string
}

export const MOOD_TO_PLANT: Record<Mood, PlantType | null> = {
  happy: 'sunflower',
  gratitude: 'daisy',
  calm: 'lotus',
  stressed: 'lavender',
  growth: 'oak_sapling',
  crisis: null,
}

export const MOOD_TO_COLOR: Record<Mood, ToneColor | null> = {
  happy: 'sunny',
  gratitude: 'warm',
  calm: 'soft_blue',
  stressed: 'lavender',
  growth: 'fresh_green',
  crisis: null,
}

export const MOOD_EMOJI: Record<Mood, string> = {
  happy: '🌻',
  gratitude: '🌼',
  calm: '🪷',
  stressed: '💜',
  growth: '🌱',
  crisis: '💙',
}

export const QUESTS = [
  { key: 'meet_guide', title: 'Meet the Guide', description: 'Talk to the friendly Guide NPC', target: 1 },
  { key: 'first_reflection', title: 'Plant Your First Reflection', description: 'Write your first journal entry', target: 1 },
  { key: 'water_garden', title: 'Water the Garden', description: 'Visit the garden 3 days in a row', target: 3 },
  { key: 'calm_minute', title: 'A Calm Minute', description: 'Complete a breathing exercise', target: 1 },
  { key: 'weekly_reflection', title: 'Weekly Reflection', description: 'Write 7 journal entries', target: 7 },
] as const

export const UNLOCK_MILESTONES: Record<number, string> = {
  3: 'butterflies',
  7: 'lantern_decor',
  14: 'fireflies',
  21: 'new_garden_patch',
}
