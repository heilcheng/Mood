import { NextRequest, NextResponse } from 'next/server'
import type { Mood, EmotionAnalysis } from '@/lib/types'

function isDbConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId || !isDbConfigured() || userId === 'guest') {
    const fallback: EmotionAnalysis = {
      moodCounts: {},
      totalEntries: 0,
      tags: [],
      dominantMood: null,
      recentMoods: Array(30).fill(null),
    }
    return NextResponse.json(fallback)
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [allRes, recentRes] = await Promise.all([
      supabase
        .from('journal_entries')
        .select('mood, tags')
        .eq('user_id', userId),
      supabase
        .from('journal_entries')
        .select('mood, created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true }),
    ])

    const allEntries = allRes.data || []
    const recentEntries = recentRes.data || []

    // Mood counts
    const moodCounts: Partial<Record<Mood, number>> = {}
    for (const entry of allEntries) {
      if (entry.mood) {
        moodCounts[entry.mood as Mood] = (moodCounts[entry.mood as Mood] || 0) + 1
      }
    }

    // Dominant mood
    let dominantMood: Mood | null = null
    let maxCount = 0
    for (const [mood, count] of Object.entries(moodCounts)) {
      if ((count as number) > maxCount) {
        maxCount = count as number
        dominantMood = mood as Mood
      }
    }

    // Top 8 tags
    const tagFreq: Record<string, number> = {}
    for (const entry of allEntries) {
      if (Array.isArray(entry.tags)) {
        for (const tag of entry.tags) {
          tagFreq[tag] = (tagFreq[tag] || 0) + 1
        }
      }
    }
    const tags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => t)

    // Build 30-day mood array (index 0 = 30 days ago, index 29 = today)
    const recentMoods: (Mood | null)[] = Array(30).fill(null)
    for (const entry of recentEntries) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      const idx = 29 - daysAgo
      if (idx >= 0 && idx < 30) {
        recentMoods[idx] = entry.mood as Mood
      }
    }

    const result: EmotionAnalysis = {
      moodCounts,
      totalEntries: allEntries.length,
      tags,
      dominantMood,
      recentMoods,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('/api/emotion-analysis error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
