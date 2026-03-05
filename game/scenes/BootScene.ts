import * as Phaser from 'phaser'
import { ProceduralAssets } from '../utils/ProceduralAssets'

export const TILE_SIZE = 16
export const MAP_WIDTH = 30
export const MAP_HEIGHT = 25

// Tile IDs
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

// NPC positions
export const NPC_POSITIONS = {
  guide: { x: 18, y: 10 },
  gardener: { x: 8, y: 8 },
  neighbor: { x: 22, y: 16 },
}

// House position (in tiles)
export const HOUSE_POSITION = { x: 20, y: 6 }
export const POND_POSITION = { x: 6, y: 16 }
export const GARDEN_ORIGIN = { x: 4, y: 4 }
export const PLAYER_START = { x: 14, y: 12 }

function buildMapData(): number[][] {
  const map: number[][] = []

  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      const isWaterBorder = x < 2 || x >= MAP_WIDTH - 2 || y < 2 || y >= MAP_HEIGHT - 2
      if (isWaterBorder) {
        map[y][x] = TILES.WATER
      } else {
        map[y][x] = TILES.GRASS
      }
    }
  }

  // Water edge transitions
  for (let y = 2; y < MAP_HEIGHT - 2; y++) {
    for (let x = 2; x < MAP_WIDTH - 2; x++) {
      if (map[y][x] !== TILES.GRASS) continue
      const n = y === 2
      const s = y === MAP_HEIGHT - 3
      const e = x === MAP_WIDTH - 3
      const w = x === 2
      if (n && w) map[y][x] = TILES.WATER_NW
      else if (n && e) map[y][x] = TILES.WATER_NE
      else if (s && w) map[y][x] = TILES.WATER_SW
      else if (s && e) map[y][x] = TILES.WATER_SE
      else if (n) map[y][x] = TILES.WATER_N
      else if (s) map[y][x] = TILES.WATER_S
      else if (w) map[y][x] = TILES.WATER_W
      else if (e) map[y][x] = TILES.WATER_E
    }
  }

  // Cross-shaped dirt path
  const centerX = Math.floor(MAP_WIDTH / 2)
  const centerY = Math.floor(MAP_HEIGHT / 2)
  for (let x = 2; x < MAP_WIDTH - 2; x++) {
    if (map[centerY][x] === TILES.GRASS || map[centerY][x] >= TILES.WATER_N) {
      map[centerY][x] = TILES.PATH
    }
  }
  for (let y = 2; y < MAP_HEIGHT - 2; y++) {
    if (map[y][centerX] === TILES.GRASS || map[y][centerX] >= TILES.WATER_N) {
      map[y][centerX] = TILES.PATH
    }
  }

  // Garden soil plot (5x5 at top-left area)
  for (let y = GARDEN_ORIGIN.y; y < GARDEN_ORIGIN.y + 5; y++) {
    for (let x = GARDEN_ORIGIN.x; x < GARDEN_ORIGIN.x + 5; x++) {
      map[y][x] = TILES.SOIL
    }
  }

  // Dirt path around garden
  for (let x = GARDEN_ORIGIN.x - 1; x <= GARDEN_ORIGIN.x + 5; x++) {
    map[GARDEN_ORIGIN.y - 1][x] = TILES.DIRT
    map[GARDEN_ORIGIN.y + 5][x] = TILES.DIRT
  }
  for (let y = GARDEN_ORIGIN.y - 1; y <= GARDEN_ORIGIN.y + 5; y++) {
    map[y][GARDEN_ORIGIN.x - 1] = TILES.DIRT
    map[y][GARDEN_ORIGIN.x + 5] = TILES.DIRT
  }

  // Area around house (dirt)
  for (let y = HOUSE_POSITION.y - 1; y <= HOUSE_POSITION.y + 4; y++) {
    for (let x = HOUSE_POSITION.x - 1; x <= HOUSE_POSITION.x + 4; x++) {
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        if (map[y][x] !== TILES.PATH) map[y][x] = TILES.DIRT
      }
    }
  }

  // Pond area (water)
  for (let y = POND_POSITION.y - 1; y <= POND_POSITION.y + 2; y++) {
    for (let x = POND_POSITION.x - 1; x <= POND_POSITION.x + 3; x++) {
      if (y >= 2 && y < MAP_HEIGHT - 2 && x >= 2 && x < MAP_WIDTH - 2) {
        map[y][x] = TILES.WATER
      }
    }
  }

  return map
}

export const MAP_DATA = buildMapData()

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create(): void {
    ProceduralAssets.generate(this)
    this.scene.start('FarmScene')
  }
}
