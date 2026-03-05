import { NextRequest, NextResponse } from 'next/server'
import { aiAnalyze } from '@/lib/ai'
import { createClient } from '@supabase/supabase-js'

function isDbConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET: garden state
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const userId = searchParams.get('userId')

  if (action === 'gardenState' && userId) {
    if (!isDbConfigured()) {
      return NextResponse.json({
        user_id: userId,
        last_active: new Date().toISOString(),
        streak: 0,
        weather_state: 'sunshine',
        unlocked_items: [],
        growth_boost_until: null,
      })
    }

    const supabase = getServiceClient()
    const { data: existing } = await supabase
      .from('garden_state')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) return NextResponse.json(existing)

    const defaults = {
      user_id: userId,
      last_active: new Date().toISOString(),
      streak: 0,
      weather_state: 'sunshine',
      unlocked_items: [],
      growth_boost_until: null,
    }
    await supabase.from('garden_state').insert(defaults)
    return NextResponse.json(defaults)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// POST: analyze journal entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, userId, savePlant, tileX, tileY, plantType, mood, confidence, tags, shortPrompt } = body

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const result = await aiAnalyze(text)

    // No DB configured — return analysis + a synthetic local plant so the game still works
    if (!isDbConfigured()) {
      if (savePlant && plantType && tileX !== undefined && tileY !== undefined) {
        const plant = {
          id: `local_${Date.now()}`,
          user_id: userId || 'guest',
          tile_x: tileX,
          tile_y: tileY,
          plant_type: plantType,
          stage: 0,
          planted_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        }
        return NextResponse.json({ ...result, plant })
      }
      return NextResponse.json(result)
    }

    // DB-backed path
    if (savePlant && userId && plantType && tileX !== undefined && tileY !== undefined) {
      const supabase = getServiceClient()

      await supabase.from('journal_entries').insert({
        user_id: userId,
        text,
        mood: mood || result.mood,
        confidence: confidence ?? result.confidence,
        tags: tags ?? result.tags,
        short_prompt: shortPrompt ?? result.short_reflection_prompt,
        created_at: new Date().toISOString(),
      })

      const now = new Date().toISOString()
      const { data: plant, error: plantErr } = await supabase
        .from('plants')
        .insert({
          user_id: userId,
          tile_x: tileX,
          tile_y: tileY,
          plant_type: plantType,
          stage: 0,
          planted_at: now,
          last_updated: now,
        })
        .select()
        .single()

      if (plantErr) console.error('Plant save error:', plantErr)

      const { data: gardenState } = await supabase
        .from('garden_state')
        .select('streak, unlocked_items')
        .eq('user_id', userId)
        .single()

      if (gardenState) {
        const { count } = await supabase
          .from('journal_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        const entryCount = count || 0
        const { GardenSystem } = await import('@/game/systems/GardenSystem')
        const newUnlocks = GardenSystem.checkUnlocks(entryCount, gardenState.unlocked_items || [])
        const allUnlocks = [...(gardenState.unlocked_items || []), ...newUnlocks]

        await supabase
          .from('garden_state')
          .update({ last_active: now, streak: (gardenState.streak || 0) + 1, unlocked_items: allUnlocks })
          .eq('user_id', userId)
      }

      return NextResponse.json({ ...result, plant: plant || null })
    }

    if (userId && userId !== 'guest' && !savePlant) {
      const supabase = getServiceClient()
      try {
        await supabase.from('journal_entries').insert({
          user_id: userId,
          text,
          mood: result.mood,
          confidence: result.confidence,
          tags: result.tags,
          short_prompt: result.short_reflection_prompt,
          created_at: new Date().toISOString(),
        })
      } catch (e) {
        console.error('Entry save error:', e)
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('/api/analyze error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
