import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const { dataUrl } = (await req.json()) as { dataUrl: string }
    if (!dataUrl?.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 })
    }

    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    const dir = path.join(process.cwd(), 'public', 'debug')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'terrain_atlas.png'), buffer)

    return NextResponse.json({ ok: true, path: '/debug/terrain_atlas.png' })
  } catch (err) {
    console.error('save-atlas error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
