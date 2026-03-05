import { NextRequest, NextResponse } from 'next/server'
import { generateWeeklySummary } from '@/lib/ai'
import { createClient } from '@supabase/supabase-js'
import type { JournalEntry } from '@/lib/types'

function isDbConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let { entries, userId, allEntries: fetchAll } = body

    // Fetch from DB only when configured and entries weren't passed in
    if (isDbConfigured() && userId && userId !== 'guest' && (!entries || entries.length === 0)) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (!fetchAll) {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('created_at', weekAgo.toISOString())
      }

      const { data } = await query
      entries = data || []
    }

    const summary = await generateWeeklySummary((entries || []) as JournalEntry[])
    return NextResponse.json(summary)
  } catch (err) {
    console.error('/api/weekly-summary error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
