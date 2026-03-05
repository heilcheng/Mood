import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Plant, GardenState, PlantType } from './types'

function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getOrCreateGardenState(userId: string): Promise<GardenState> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('garden_state')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) return existing as GardenState

  const fresh: GardenState = {
    user_id: userId,
    last_active: new Date().toISOString(),
    streak: 0,
    weather_state: 'sunshine',
    unlocked_items: [],
    growth_boost_until: null,
  }

  await supabase.from('garden_state').insert(fresh)
  return fresh
}

export async function updateGardenState(
  userId: string,
  updates: Partial<GardenState>
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('garden_state')
    .update(updates)
    .eq('user_id', userId)
}

export async function savePlant(
  userId: string,
  tileX: number,
  tileY: number,
  plantType: PlantType
): Promise<Plant> {
  const supabase = createClient()
  const now = new Date().toISOString()

  const plant = {
    user_id: userId,
    tile_x: tileX,
    tile_y: tileY,
    plant_type: plantType,
    stage: 0,
    planted_at: now,
    last_updated: now,
  }

  const { data, error } = await supabase
    .from('plants')
    .insert(plant)
    .select()
    .single()

  if (error) throw error
  return data as Plant
}

export async function getPlants(userId: string): Promise<Plant[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('user_id', userId)
    .order('planted_at', { ascending: true })

  if (error) throw error
  return (data as Plant[]) || []
}

export async function advancePlantStage(plantId: string): Promise<void> {
  const supabase = createClient()
  const { data: plant } = await supabase
    .from('plants')
    .select('stage')
    .eq('id', plantId)
    .single()

  if (!plant) return

  const newStage = Math.min((plant as { stage: number }).stage + 1, 3)
  await supabase
    .from('plants')
    .update({ stage: newStage, last_updated: new Date().toISOString() })
    .eq('id', plantId)
}

export async function getJournalEntries(userId: string, limit = 50) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getWeeklyEntries(userId: string) {
  const supabase = createClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', weekAgo.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getQuests(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
  return data || []
}

export async function upsertQuest(userId: string, questKey: string, progress: number, status: 'active' | 'completed') {
  const supabase = createClient()
  await supabase
    .from('quests')
    .upsert({
      user_id: userId,
      quest_key: questKey,
      progress,
      status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,quest_key' })
}
