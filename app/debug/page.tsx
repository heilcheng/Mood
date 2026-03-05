'use client'

import { useEffect, useRef, useState } from 'react'

const TILE_W = 16
const TILE_H = 16
const SCALE  = 3          // render each tile at 3× for readability
const LABEL_H = 18        // px below each tile for the index label
const TERRAIN_SRC = '/assets/terrain.png'

export default function DebugPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dims, setDims]     = useState({ cols: 0, rows: 0, total: 0 })
  const [atlasUrl, setAtlasUrl] = useState('')
  const [saving, setSaving]    = useState(false)
  const [saved, setSaved]      = useState(false)
  const [hover, setHover]      = useState<{ idx: number; row: number; col: number } | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = TERRAIN_SRC
    img.onload = () => {
      const cols  = Math.floor(img.width  / TILE_W)
      const rows  = Math.floor(img.height / TILE_H)
      const total = cols * rows

      const cellW = TILE_W * SCALE
      const cellH = TILE_H * SCALE + LABEL_H

      const canvas = canvasRef.current!
      canvas.width  = cols * cellW
      canvas.height = rows * cellH

      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col
          const dx  = col * cellW
          const dy  = row * cellH

          // Checkerboard background (shows transparency)
          for (let ty = 0; ty < TILE_H * SCALE; ty += 8) {
            for (let tx = 0; tx < cellW; tx += 8) {
              ctx.fillStyle = ((tx + ty) / 8) % 2 === 0 ? '#666' : '#999'
              ctx.fillRect(dx + tx, dy + ty, 8, 8)
            }
          }

          // Draw tile
          ctx.drawImage(img,
            col * TILE_W, row * TILE_H, TILE_W, TILE_H,
            dx, dy, cellW, TILE_H * SCALE
          )

          // Tile border
          ctx.strokeStyle = 'rgba(255,0,0,0.35)'
          ctx.lineWidth = 1
          ctx.strokeRect(dx + 0.5, dy + 0.5, cellW - 1, TILE_H * SCALE - 1)

          // Label background
          ctx.fillStyle = 'rgba(0,0,0,0.82)'
          ctx.fillRect(dx, dy + TILE_H * SCALE, cellW, LABEL_H)

          // Index (big)
          ctx.fillStyle = '#ffe'
          ctx.font = `bold ${Math.floor(LABEL_H * 0.55)}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillText(`${idx}`, dx + cellW / 2, dy + TILE_H * SCALE + 1)

          // row,col (small)
          ctx.fillStyle = '#aaa'
          ctx.font = `${Math.floor(LABEL_H * 0.42)}px monospace`
          ctx.fillText(`r${row}c${col}`, dx + cellW / 2, dy + TILE_H * SCALE + LABEL_H * 0.56)
        }
      }

      setDims({ cols, rows, total })
      setAtlasUrl(canvas.toDataURL('image/png'))
    }

    img.onerror = () => {
      const canvas = canvasRef.current!
      canvas.width = 400; canvas.height = 60
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#f44'; ctx.font = '14px monospace'
      ctx.fillText(`Failed to load ${TERRAIN_SRC}`, 8, 30)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top)  * scaleY

    const cellW = TILE_W * SCALE
    const cellH = TILE_H * SCALE + LABEL_H
    const col   = Math.floor(px / cellW)
    const row   = Math.floor(py / cellH)
    if (col >= 0 && col < dims.cols && row >= 0 && row < dims.rows) {
      setHover({ idx: row * dims.cols + col, row, col })
    } else {
      setHover(null)
    }
  }

  const saveToServer = async () => {
    if (!atlasUrl) return
    setSaving(true)
    try {
      const res = await fetch('/api/debug/save-atlas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: atlasUrl }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
      else alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: '#1a1a2e', minHeight: '100vh', padding: 24, fontFamily: 'monospace', color: '#eee' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Terrain Atlas Debug</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
        Source: <code style={{ color: '#4af' }}>{TERRAIN_SRC}</code>
        {dims.total > 0 && ` — ${dims.cols} cols × ${dims.rows} rows — ${dims.total} tiles (${TILE_W}×${TILE_H} px each)`}
      </p>

      {hover && (
        <div style={{
          position: 'fixed', top: 16, right: 16,
          background: '#000d', padding: '10px 16px', borderRadius: 8,
          border: '1px solid #4af', fontSize: 14,
        }}>
          <div style={{ color: '#ffe', fontSize: 18 }}>tile <strong>{hover.idx}</strong></div>
          <div style={{ color: '#aaa' }}>row {hover.row}, col {hover.col}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {atlasUrl && (
          <a
            href={atlasUrl}
            download="terrain_atlas.png"
            style={{ color: '#4af', background: '#2a2a4a', padding: '8px 16px', borderRadius: 6, textDecoration: 'none', fontSize: 13 }}
          >
            ↓ Download PNG
          </a>
        )}
        <button
          onClick={saveToServer}
          disabled={!atlasUrl || saving}
          style={{ color: saved ? '#4f4' : '#4f4', background: '#2a4a2a', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13 }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved to /public/debug/terrain_atlas.png' : 'Save to /public/debug/'}
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
          style={{ imageRendering: 'pixelated', border: '1px solid #444', cursor: 'crosshair', maxWidth: '100%' }}
        />
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: '#666' }}>
        <p>Hover over a tile to see its index. Use indices in <code>/game/phaser/tiles/tileCatalog.ts</code>.</p>
        <p>GRASS_FILL must be the flat solid-green tile used as base fill for all walkable land.</p>
        <p>Do NOT use cliff/ledge edge tiles (rows 0–2, cols 0–2) as fill tiles.</p>
      </div>
    </div>
  )
}
