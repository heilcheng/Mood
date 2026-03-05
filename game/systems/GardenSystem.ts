import type { Mood, Plant, PlantType } from '@/lib/types'
import { MOOD_TO_PLANT } from '@/lib/types'

// Garden origin matching BootScene (x=4, y=4), duplicated to avoid Phaser import on server
const GARDEN_ORIGIN = { x: 4, y: 4 }
const GRID_SIZE = 5

export class GardenSystem {
  static moodToPlantType(mood: Mood): PlantType | null {
    return MOOD_TO_PLANT[mood]
  }

  static getNextPlotPosition(plants: Plant[]): { x: number; y: number } | null {
    const occupied = new Set(plants.map((p) => `${p.tile_x},${p.tile_y}`))

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = GARDEN_ORIGIN.x + col
        const y = GARDEN_ORIGIN.y + row
        if (!occupied.has(`${x},${y}`)) {
          return { x, y }
        }
      }
    }

    // All slots full — place in extended area (if new_garden_patch unlocked)
    return { x: GARDEN_ORIGIN.x, y: GARDEN_ORIGIN.y + GRID_SIZE + 1 }
  }

  static computeGrowthBoost(lastActiveDate: Date): number {
    const now = new Date()
    const hoursAway = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60)

    if (hoursAway >= 24) return 1.0
    if (hoursAway >= 12) return 0.5
    if (hoursAway >= 6) return 0.25
    return 0
  }

  static checkUnlocks(entryCount: number, currentUnlocks: string[]): string[] {
    const milestones: Record<number, string> = {
      3: 'butterflies',
      7: 'lantern_decor',
      14: 'fireflies',
      21: 'new_garden_patch',
    }

    const newUnlocks: string[] = []
    for (const [count, item] of Object.entries(milestones)) {
      if (entryCount >= parseInt(count) && !currentUnlocks.includes(item)) {
        newUnlocks.push(item)
      }
    }
    return newUnlocks
  }
}
