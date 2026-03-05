import * as Phaser from 'phaser'
import { CozyValleyLoader } from '../utils/CozyValleyLoader'

export const TILE_SIZE = 16
export const MAP_WIDTH = 40
export const MAP_HEIGHT = 35

export const TILES = {
  WATER: 0,
  GRASS: 1,
  DIRT: 2,
  SOIL: 3,
  PATH: 4,
  WATER_N: 5,
  WATER_S: 6,
  WATER_E: 7,
  WATER_W: 8,
  WATER_NE: 9,
  WATER_NW: 10,
  WATER_SE: 11,
  WATER_SW: 12,
}

export const NPC_POSITIONS = {
  guide: { x: 27, y: 8 },
  gardener: { x: 7, y: 23 },
  neighbor: { x: 30, y: 15 },
}

export const HOUSE_POSITION = { x: 25, y: 4 }
export const POND_POSITION = { x: 22, y: 20 }
export const GARDEN_ORIGIN = { x: 4, y: 19 }
export const PLAYER_START = { x: 18, y: 14 }
export const COW_FARM_ORIGIN = { x: 3, y: 3 }
export const DUCK_ZONE_ORIGIN = { x: 20, y: 17 }
export const DUCK_POND = { x: 21, y: 18, w: 15, h: 13 }

function buildMapData(): number[][] {
  const map: number[][] = []

  // 1: Fill entirely with water first
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      map[y][x] = TILES.WATER
    }
  }

  // 2: Main island grass + cliff border
  const minX = 2, maxX = 37
  const minY = 2, maxY = 32
  for (let y = minY; y <= Math.min(maxY, 34); y++) {
    for (let x = minX; x <= Math.min(maxX, 39); x++) {
      let tile = TILES.GRASS

      const isTop = (y === minY)
      const isBottom = (y === maxY)
      const isLeft = (x === minX)
      const isRight = (x === maxX)

      if (isTop && isLeft) tile = 100 + 0  // NW cliff
      else if (isTop && isRight) tile = 100 + 4  // NE cliff
      else if (isBottom && isLeft) tile = 100 + 32 // SW cliff
      else if (isBottom && isRight) tile = 100 + 36 // SE cliff
      else if (isTop) tile = 100 + 2  // N cliff (upper ledge)
      else if (isBottom) tile = 100 + 34 // S cliff (lower ledge)
      else if (isLeft) tile = 100 + 16 // W cliff
      else if (isRight) tile = 100 + 20 // E cliff

      map[y][x] = tile
    }
  }

  // 3: House area dirt
  for (let y = 3; y <= 12; y++) {
    for (let x = 20; x <= 36; x++) {
      if (map[y] && map[y][x] !== undefined) map[y][x] = TILES.DIRT
    }
  }

  // 4: Flower garden soil strictly inside the fence (x=[5, 17], y=[20, 31])
  // We'll split this into 4 quadrants (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
  // Top-Left: x=[6, 10], y=[21, 24]
  // Top-Right: x=[12, 16], y=[21, 24]
  // Bottom-Left: x=[6, 10], y=[27, 30]
  // Bottom-Right: x=[12, 16], y=[27, 30]
  const plots = [
    { startX: 6, endX: 10, startY: 21, endY: 24 },
    { startX: 12, endX: 16, startY: 21, endY: 24 },
    { startX: 6, endX: 10, startY: 27, endY: 30 },
    { startX: 12, endX: 16, startY: 27, endY: 30 },
  ]
  plots.forEach(plot => {
    for (let y = plot.startY; y <= plot.endY; y++) {
      for (let x = plot.startX; x <= plot.endX; x++) {
        if (map[y] && map[y][x] !== undefined) map[y][x] = TILES.SOIL
      }
    }
  })

  // 4b: Garden Walkway Entrance (DIRT path passing through East fence opening at x=18, y=25)
  map[25][18] = TILES.DIRT
  map[25][19] = TILES.DIRT
  map[25][20] = TILES.DIRT

  // 4c: Cow Farm Walkway Entrance (DIRT path passing through South fence opening at x=10, y=13)
  map[12][10] = TILES.DIRT
  map[13][10] = TILES.DIRT
  map[14][10] = TILES.DIRT



  // 5: Duck pond pure water + shore edges inside the island
  for (let y = 18; y <= 30; y++) {
    for (let x = 21; x <= 35; x++) {
      const isTop = (y === 18)
      const isBottom = (y === 30)
      const isLeft = (x === 21)
      const isRight = (x === 35)

      let tile = TILES.WATER
      if (isTop && isLeft) tile = TILES.WATER_NW
      else if (isTop && isRight) tile = TILES.WATER_NE
      else if (isBottom && isLeft) tile = TILES.WATER_SW
      else if (isBottom && isRight) tile = TILES.WATER_SE
      else if (isTop) tile = TILES.WATER_N
      else if (isBottom) tile = TILES.WATER_S
      else if (isLeft) tile = TILES.WATER_W
      else if (isRight) tile = TILES.WATER_E

      if (map[y] && map[y][x] !== undefined) map[y][x] = tile
    }
  }

  return map
}

export const MAP_DATA = buildMapData()

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    CozyValleyLoader.preloadAll(this)
  }

  create(): void {
    CozyValleyLoader.createAnims(this)
    this.generateOverlayTextures()
    this.generateParticleTextures()
    this.generateUITextures()
    // Forward initData (avatar, plants, unlockedItems) stored by PhaserGame.ts
    const initData = ((this.game as unknown as Record<string, unknown>)._initData || {}) as Record<string, unknown>
    this.scene.start('FarmScene', initData)
  }

  private gt(key: string, w: number, h: number, fn: (g: Phaser.GameObjects.Graphics) => void): void {
    if (this.textures.exists(key)) return
    const g = this.add.graphics()
    fn(g)
    g.generateTexture(key, w, h)
    g.destroy()
  }

  private generateNPCTextures(): void {
    // 16×32 front-facing pixel-art characters (same dimensions as player character frames)
    const npcs = [
      { key: 'npc_guide',    body: 0x7ab8f5, pants: 0x3a5fa0, hat: 0x3a5fa0, skin: 0xffd5a0 },
      { key: 'npc_gardener', body: 0x7ac97a, pants: 0x3a6e3a, hat: 0x2d5c2d, skin: 0xffd5a0 },
      { key: 'npc_neighbor', body: 0xf5c87a, pants: 0x8c6030, hat: 0x8c6030, skin: 0xffe0b0 },
    ]
    npcs.forEach(({ key, body, pants, hat, skin }) => {
      this.gt(key, 16, 32, (g) => {
        // Shadow
        g.fillStyle(0x000000, 0.18); g.fillEllipse(8, 31, 10, 3)
        // Legs / pants
        g.fillStyle(pants, 1); g.fillRect(4, 22, 3, 8); g.fillRect(9, 22, 3, 8)
        // Shoes
        g.fillStyle(0x333333, 1); g.fillRect(3, 28, 4, 3); g.fillRect(9, 28, 4, 3)
        // Body / shirt
        g.fillStyle(body, 1); g.fillRect(3, 14, 10, 9)
        // Arms
        g.fillStyle(body, 1); g.fillRect(0, 15, 3, 7); g.fillRect(13, 15, 3, 7)
        // Hands
        g.fillStyle(skin, 1); g.fillRect(0, 21, 3, 2); g.fillRect(13, 21, 3, 2)
        // Neck
        g.fillStyle(skin, 1); g.fillRect(6, 11, 4, 4)
        // Head
        g.fillStyle(skin, 1); g.fillRect(4, 4, 8, 9)
        // Hat
        g.fillStyle(hat, 1); g.fillRect(3, 2, 10, 4)
        // Eyes (front-facing)
        g.fillStyle(0x333333, 1); g.fillRect(5, 8, 2, 2); g.fillRect(9, 8, 2, 2)
        // Smile
        g.fillStyle(0xc07050, 0.8); g.fillRect(6, 12, 1, 1); g.fillRect(9, 12, 1, 1)
      })
    })
  }

  private generateOverlayTextures(): void {
    this.gt('cloud', 44, 28, (g) => {
      g.fillStyle(0xffffff, 0.85)
      g.fillEllipse(20, 20, 24, 16); g.fillEllipse(32, 16, 20, 14)
      g.fillEllipse(12, 16, 18, 12); g.fillRect(10, 18, 34, 10)
    })
    this.gt('sun', 32, 32, (g) => {
      g.fillStyle(0xffdd00, 1); g.fillEllipse(16, 16, 20, 20)
      g.lineStyle(2, 0xffdd00, 0.8)
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8
        g.lineBetween(16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, 16 + Math.cos(a) * 18, 16 + Math.sin(a) * 18)
      }
    })
    this.gt('rainbow', 128, 128, (g) => {
      ;[0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff].forEach((c, i) => {
        g.lineStyle(3, c, 0.6); g.strokeCircle(64, 64, 50 + i * 4)
      })
    })
    this.gt('raindrop', 4, 8, (g) => {
      g.fillStyle(0x80b0ff, 0.7); g.fillRect(1, 0, 2, 6); g.fillEllipse(2, 6, 4, 3)
    })
    this.gt('night_overlay', 32, 32, (g) => {
      g.fillStyle(0x001030, 1); g.fillRect(0, 0, 32, 32)
    })
  }

  private generateParticleTextures(): void {
    for (let i = 0; i < 4; i++) {
      this.gt(`sparkle_${i}`, 10, 10, (g) => {
        g.fillStyle(0xffd700, 1)
        g.fillRect(4, 0, 2, 10); g.fillRect(0, 4, 10, 2)
        if (i > 1) { g.fillRect(2, 2, 2, 2); g.fillRect(6, 2, 2, 2); g.fillRect(2, 6, 2, 2); g.fillRect(6, 6, 2, 2) }
      })
    }
    for (let i = 0; i < 3; i++) {
      const a = 0.4 + i * 0.2
      this.gt(`firefly_${i}`, 16, 16, (g) => {
        g.fillStyle(0xffff80, a); g.fillEllipse(8, 8, 8, 8)
        g.fillStyle(0xffffff, a * 0.8); g.fillEllipse(8, 8, 4, 4)
      })
    }
    for (let i = 0; i < 2; i++) {
      const sp = i === 0 ? 1 : 0.6
      this.gt(`butterfly_${i}`, 16, 12, (g) => {
        g.fillStyle(0xff80c0, 0.9)
        g.fillEllipse(4 * sp, 4, 8 * sp, 6)
        g.fillEllipse(12 + (1 - sp) * 4, 5, 7 * sp, 5)
        g.fillStyle(0x333333, 1); g.fillRect(7, 2, 2, 10)
      })
    }
    this.gt('particle_dot', 8, 8, (g) => { g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4) })
    this.gt('particle_leaf', 8, 8, (g) => { g.fillStyle(0x60c040, 0.8); g.fillEllipse(4, 4, 8, 5) })
  }

  private generateUITextures(): void {
    this.gt('speech_bubble', 120, 50, (g) => {
      g.fillStyle(0xffffff, 0.95); g.fillRoundedRect(0, 0, 120, 40, 8)
      g.fillTriangle(20, 40, 30, 40, 25, 50)
    })
    this.gt('e_prompt', 20, 20, (g) => {
      g.fillStyle(0x000000, 0.6); g.fillRoundedRect(0, 0, 20, 20, 4)
      g.fillStyle(0xffffff, 1)
      g.fillRect(5, 5, 10, 2); g.fillRect(5, 9, 8, 2); g.fillRect(5, 13, 10, 2); g.fillRect(5, 5, 2, 10)
    })
    // Lantern (still used by DayNightSystem unlock)
    this.gt('lantern', 16, 17, (g) => {
      g.fillStyle(0xffd700, 1); g.fillRect(6, 0, 4, 4)
      g.fillStyle(0x888888, 1); g.fillRect(4, 4, 8, 12)
      g.fillStyle(0xffe080, 0.8); g.fillRect(5, 5, 6, 10)
      g.fillStyle(0x888888, 1); g.fillRect(3, 15, 10, 2)
    })
  }
}
