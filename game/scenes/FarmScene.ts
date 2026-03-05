import * as Phaser from 'phaser'
import { Player } from '../objects/Player'
import { NPC } from '../objects/NPC'
import { PlantSprite } from '../objects/PlantSprite'
import { WeatherSystem } from '../systems/WeatherSystem'
import { DayNightSystem } from '../systems/DayNightSystem'
import { EventBridge } from '../EventBridge'
import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  MAP_DATA,
  TILES,
  NPC_POSITIONS,
  HOUSE_POSITION,
  POND_POSITION,
  GARDEN_ORIGIN,
  PLAYER_START,
} from './BootScene'
import type { Plant, WeatherState } from '@/lib/types'

interface InteractPoint {
  id: string
  getX: () => number
  getY: () => number
  radius: number
}

export class FarmScene extends Phaser.Scene {
  private player!: Player
  private npcs: NPC[] = []
  private plantSprites: Map<string, PlantSprite> = new Map()
  private weatherSystem!: WeatherSystem
  private dayNightSystem!: DayNightSystem
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: {
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
  }
  private eKey!: Phaser.Input.Keyboard.Key
  private jKey!: Phaser.Input.Keyboard.Key
  private escKey!: Phaser.Input.Keyboard.Key
  private interactPoints: InteractPoint[] = []
  private collisionTiles: Phaser.GameObjects.Rectangle[] = []
  private tileImages: Phaser.GameObjects.Image[] = []
  private butterflies: Phaser.GameObjects.Image[] = []
  private eventCleanups: Array<() => void> = []
  private currentNearby: string | null = null
  // Track initial plants passed in from store
  private initialPlants: Plant[] = []

  constructor() {
    super({ key: 'FarmScene' })
  }

  init(data: { plants?: Plant[]; avatar?: string; unlockedItems?: string[] }): void {
    this.initialPlants = data?.plants || []
    if (data?.avatar) {
      // Store for player creation
      ;(this as unknown as Record<string, unknown>)._pendingAvatar = data.avatar
    }
    if (data?.unlockedItems) {
      ;(this as unknown as Record<string, unknown>)._pendingUnlocks = data.unlockedItems
    }
  }

  create(): void {
    const avatar = ((this as unknown as Record<string, unknown>)._pendingAvatar as string) || 'farmer_girl'
    const unlockedItems = ((this as unknown as Record<string, unknown>)._pendingUnlocks as string[]) || []

    // Render tilemap
    this.renderTilemap()

    // Create player
    const px = PLAYER_START.x * TILE_SIZE + TILE_SIZE / 2
    const py = PLAYER_START.y * TILE_SIZE + TILE_SIZE
    this.player = new Player(this, px, py, avatar)

    // Camera
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(2.5)

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.jKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J)
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)

    // Collision setup
    this.setupCollisions()

    // NPCs
    this.createNPCs()

    // Interaction points (distance-based)
    this.createInteractPoints()

    // Garden plants
    this.initialPlants.forEach((p) => this.spawnPlant(p))

    // Decorations
    this.spawnDecorations(unlockedItems)

    // Ambient decorations (fish, birds, flowers)
    this.spawnAmbientDecorations()

    // Systems
    this.weatherSystem = new WeatherSystem(this)
    this.dayNightSystem = new DayNightSystem(this)

    if (unlockedItems.includes('fireflies')) {
      this.dayNightSystem.setHasFireflies(true)
    }

    if (unlockedItems.includes('butterflies')) {
      this.spawnButterflies()
    }

    // Event bridge listeners
    this.setupEventListeners()

    // Key handlers
    this.eKey.on('down', () => this.handleInteract())
    this.jKey.on('down', () => EventBridge.emit('openJournal', undefined as unknown as void))
    this.escKey.on('down', () => {
      // Signal to close any open modal (React side listens)
    })
  }

  private renderTilemap(): void {
    const tileTextures: Record<number, string> = {
      [TILES.WATER]: 'tile_water',
      [TILES.GRASS]: 'tile_grass',
      [TILES.DIRT]: 'tile_dirt',
      [TILES.SOIL]: 'tile_soil',
      [TILES.PATH]: 'tile_path',
      [TILES.WATER_N]: 'tile_water_n',
      [TILES.WATER_S]: 'tile_water_s',
      [TILES.WATER_E]: 'tile_water_e',
      [TILES.WATER_W]: 'tile_water_w',
      [TILES.WATER_NE]: 'tile_water_ne',
      [TILES.WATER_NW]: 'tile_water_nw',
      [TILES.WATER_SE]: 'tile_water_se',
      [TILES.WATER_SW]: 'tile_water_sw',
    }

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tileId = MAP_DATA[y][x]
        const textureKey = tileTextures[tileId] || 'tile_grass'
        const img = this.add.image(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          textureKey
        )
        img.setDepth(0)
        this.tileImages.push(img)
      }
    }

    // House sprite
    if (this.textures.exists('house')) {
      const house = this.add.image(
        HOUSE_POSITION.x * TILE_SIZE + 24,
        HOUSE_POSITION.y * TILE_SIZE + 16,
        'house'
      )
      house.setDepth(3)
    }

    // Pond sprite
    if (this.textures.exists('pond')) {
      const pond = this.add.image(
        POND_POSITION.x * TILE_SIZE + 16,
        POND_POSITION.y * TILE_SIZE + 8,
        'pond'
      )
      pond.setDepth(1)
    }

    // Trees
    const treePositions = [
      { x: 3, y: 17 }, { x: 5, y: 20 }, { x: 24, y: 4 },
      { x: 26, y: 18 }, { x: 10, y: 20 }, { x: 25, y: 12 },
    ]
    treePositions.forEach(({ x, y }) => {
      if (!this.textures.exists('tree_0')) return
      const tree = this.add.image(
        x * TILE_SIZE + TILE_SIZE / 2,
        y * TILE_SIZE + TILE_SIZE,
        'tree_0'
      )
      tree.setDepth(3)
      // Slow sway tween
      this.tweens.add({
        targets: tree,
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onRepeat: () => {
          tree.setTexture(tree.texture.key === 'tree_0' ? 'tree_1' : 'tree_0')
        },
      })
    })

    // Lanterns
    if (this.textures.exists('lantern')) {
      const lanternPositions = [
        { x: HOUSE_POSITION.x - 1, y: HOUSE_POSITION.y + 3 },
        { x: HOUSE_POSITION.x + 3, y: HOUSE_POSITION.y + 3 },
      ]
      lanternPositions.forEach(({ x, y }) => {
        const lantern = this.add.image(x * TILE_SIZE + 8, y * TILE_SIZE + 8, 'lantern')
        lantern.setDepth(3)
      })
    }
  }

  private setupCollisions(): void {
    // Water tiles block movement
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tileId = MAP_DATA[y][x]
        if (tileId === TILES.WATER) {
          const rect = this.add.rectangle(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE, TILE_SIZE,
            0x000000, 0
          )
          this.physics.add.existing(rect, true)
          this.collisionTiles.push(rect)
          this.physics.add.collider(this.player, rect)
        }
      }
    }

    // House collision box — upper half only so player can stand on doorstep
    const houseRect = this.add.rectangle(
      HOUSE_POSITION.x * TILE_SIZE + 24,
      HOUSE_POSITION.y * TILE_SIZE + 16,
      48, 24, 0, 0
    )
    this.physics.add.existing(houseRect, true)
    this.physics.add.collider(this.player, houseRect)
  }

  private createNPCs(): void {
    const npcConfigs = [
      {
        id: 'guide',
        x: NPC_POSITIONS.guide.x * TILE_SIZE + 8,
        y: NPC_POSITIONS.guide.y * TILE_SIZE + 16,
        textureKey: 'npc_guide',
        message: "Welcome to your Mindful Farm! Walk to the Journal House to plant reflections, or visit the pond for breathing exercises.",
      },
      {
        id: 'gardener',
        x: NPC_POSITIONS.gardener.x * TILE_SIZE + 8,
        y: NPC_POSITIONS.gardener.y * TILE_SIZE + 16,
        textureKey: 'npc_gardener',
        message: "Every feeling you write becomes a seed. Your garden grows with your heart!",
      },
      {
        id: 'neighbor',
        x: NPC_POSITIONS.neighbor.x * TILE_SIZE + 8,
        y: NPC_POSITIONS.neighbor.y * TILE_SIZE + 16,
        textureKey: 'npc_neighbor',
        message: "I've been tending this land for years. The secret? Show up, even on cloudy days.",
      },
    ]

    npcConfigs.forEach((cfg) => {
      const npc = new NPC(this, cfg)
      this.npcs.push(npc)
    })
  }

  private createInteractPoints(): void {
    const houseDoorX = HOUSE_POSITION.x * TILE_SIZE + 24
    const houseDoorY = (HOUSE_POSITION.y + 3) * TILE_SIZE  // in front of door

    this.interactPoints = [
      { id: 'journal_house', getX: () => houseDoorX, getY: () => houseDoorY, radius: 36 },
      {
        id: 'pond',
        getX: () => POND_POSITION.x * TILE_SIZE + 24,
        getY: () => POND_POSITION.y * TILE_SIZE + 16,
        radius: 48,
      },
      {
        id: 'garden',
        getX: () => (GARDEN_ORIGIN.x + 2) * TILE_SIZE,
        getY: () => (GARDEN_ORIGIN.y + 2) * TILE_SIZE,
        radius: 56,
      },
    ]

    // NPCs: live lambdas so point tracks NPC movement
    this.npcs.forEach((npc) => {
      this.interactPoints.push({
        id: `npc_${npc.npcId}`,
        getX: () => npc.x,
        getY: () => npc.y,
        radius: 32,
      })
    })
  }

  /** Returns the nearest interact point within maxRadius, or null. */
  private getNearestInteract(maxRadius: number): InteractPoint | null {
    if (!this.player) return null
    let best: InteractPoint | null = null
    let bestDist = maxRadius
    for (const pt of this.interactPoints) {
      const dx = this.player.x - pt.getX()
      const dy = this.player.y - pt.getY()
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < pt.radius && dist < bestDist) {
        best = pt
        bestDist = dist
      }
    }
    return best
  }

  private spawnPlant(plant: Plant): void {
    if (this.plantSprites.has(plant.id)) return
    const px = plant.tile_x * TILE_SIZE + TILE_SIZE / 2
    const py = plant.tile_y * TILE_SIZE + TILE_SIZE
    const sprite = new PlantSprite(this, plant, px, py)
    this.plantSprites.set(plant.id, sprite)
  }

  private spawnDecorations(unlockedItems: string[]): void {
    if (unlockedItems.includes('butterflies')) {
      this.spawnButterflies()
    }

    if (unlockedItems.includes('lantern_decor') && this.textures.exists('lantern')) {
      const lanternX = (GARDEN_ORIGIN.x + 5) * TILE_SIZE
      const lanternY = GARDEN_ORIGIN.y * TILE_SIZE
      const lantern = this.add.image(lanternX, lanternY, 'lantern')
      lantern.setDepth(3)
    }
  }

  private spawnAmbientDecorations(): void {
    // Fish in water (pond area)
    if (this.textures.exists('fish_0')) {
      for (let i = 0; i < 5; i++) {
        const fx = (POND_POSITION.x + Math.random() * 3) * TILE_SIZE
        const fy = (POND_POSITION.y + Math.random() * 2) * TILE_SIZE
        const fish = this.add.image(fx, fy, `fish_${i % 2}`)
        fish.setDepth(2)
        this.tweens.add({
          targets: fish,
          x: fx + Phaser.Math.Between(-8, 8),
          duration: 1800 + i * 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          onRepeat: () => {
            fish.setTexture(`fish_${Math.floor(Math.random() * 2)}`)
            fish.setFlipX(Math.random() < 0.5)
          },
        })
      }
    }

    // Flower patches on grass
    if (this.textures.exists('flower_patch')) {
      const grassSpots = [
        { x: 16, y: 7 }, { x: 12, y: 14 }, { x: 19, y: 18 },
        { x: 7, y: 11 }, { x: 23, y: 9 }, { x: 11, y: 17 },
        { x: 17, y: 21 }, { x: 6, y: 14 },
      ]
      grassSpots.forEach(({ x, y }) => {
        if (MAP_DATA[y] && MAP_DATA[y][x] === TILES.GRASS) {
          const flower = this.add.image(x * TILE_SIZE + 4, y * TILE_SIZE + 8, 'flower_patch')
          flower.setDepth(1)
        }
      })
    }

    // Mushrooms near trees
    if (this.textures.exists('mushroom')) {
      const mushSpots = [{ x: 3, y: 18 }, { x: 24, y: 5 }, { x: 25, y: 13 }]
      mushSpots.forEach(({ x, y }) => {
        const mush = this.add.image(x * TILE_SIZE + 6, y * TILE_SIZE + 8, 'mushroom')
        mush.setDepth(2)
      })
    }

    // Ambient birds — fly across screen every 12 seconds
    if (this.textures.exists('bird_0')) {
      this.time.addEvent({
        delay: 12000,
        loop: true,
        callback: () => {
          const startY = (4 + Math.random() * 6) * TILE_SIZE
          const bird1 = this.add.image(0, startY, 'bird_0')
          const bird2 = this.add.image(-12, startY + 4, 'bird_0')
          bird1.setDepth(8)
          bird2.setDepth(8)
          const endX = MAP_WIDTH * TILE_SIZE + 20
          this.tweens.add({
            targets: [bird1, bird2],
            x: `+=${endX}`,
            duration: 5000,
            ease: 'Linear',
            onUpdate: () => {
              bird1.setTexture(`bird_${Math.floor(this.time.now / 150) % 3 === 2 ? 1 : 0}`)
              bird2.setTexture(`bird_${Math.floor(this.time.now / 150 + 1) % 3 === 2 ? 1 : 0}`)
            },
            onComplete: () => {
              bird1.destroy()
              bird2.destroy()
            },
          })
        },
      })
    }
  }

  private spawnButterflies(): void {
    if (!this.textures.exists('butterfly_0')) return
    for (let i = 0; i < 4; i++) {
      const bx = (GARDEN_ORIGIN.x + Math.random() * 6) * TILE_SIZE
      const by = (GARDEN_ORIGIN.y + Math.random() * 6) * TILE_SIZE
      const butterfly = this.add.image(bx, by, `butterfly_${i % 2}`)
      butterfly.setDepth(6)
      this.butterflies.push(butterfly)

      this.tweens.add({
        targets: butterfly,
        x: bx + Phaser.Math.Between(-30, 30),
        y: by + Phaser.Math.Between(-20, 20),
        duration: 1500 + i * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onRepeat: () => {
          butterfly.setTexture(`butterfly_${Math.floor(Math.random() * 2)}`)
        },
      })
    }
  }

  private setupEventListeners(): void {
    const cleanPlantAdded = EventBridge.on('plantAdded', (plant) => {
      // Check if plant already exists (advance stage) or is new
      const existing = [...this.plantSprites.values()].find(
        (s) => s.plantData.tile_x === plant.tile_x && s.plantData.tile_y === plant.tile_y
      )
      if (existing) {
        existing.advanceStage()
      } else {
        this.spawnPlant(plant)
      }
    })

    const cleanWeather = EventBridge.on('weatherChanged', (weather: WeatherState) => {
      this.weatherSystem.setWeather(weather)
    })

    const cleanGrowth = EventBridge.on('growthBoost', () => {
      this.plantSprites.forEach((sprite) => {
        this.tweens.add({
          targets: sprite,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 300,
          yoyo: true,
          ease: 'Back.easeOut',
        })
        sprite.playSparkle()
      })
    })

    const cleanDayNight = EventBridge.on('dayNightTick', ({ phase }) => {
      this.weatherSystem.applyDayNightPhase(phase)
    })

    this.eventCleanups.push(cleanPlantAdded, cleanWeather, cleanGrowth, cleanDayNight)
  }

  private handleInteract(): void {
    const pt = this.getNearestInteract(200)
    if (!pt) return

    if (pt.id === 'journal_house') {
      EventBridge.emit('openJournal', undefined as unknown as void)
    } else if (pt.id === 'pond') {
      EventBridge.emit('openBreathing', undefined as unknown as void)
    } else if (pt.id.startsWith('npc_')) {
      const npcId = pt.id.replace('npc_', '')
      const npc = this.npcs.find((n) => n.npcId === npcId)
      if (npc) {
        EventBridge.emit('talkNPC', { npcId, message: npc.message })
        EventBridge.emit('questProgress', {
          questKey: 'meet_guide',
          progress: 1,
          completed: npcId === 'guide',
        })
      }
    } else if (pt.id === 'garden') {
      EventBridge.emit('openJournal', undefined as unknown as void)
    }
  }

  private checkNearbyInteractables(): void {
    // Use exact radius + 16px hint buffer so hint always precedes action
    const pt = this.getNearestInteract(200)
    const found = pt ? pt.id : null

    if (found !== this.currentNearby) {
      this.currentNearby = found
      EventBridge.emit('nearbyInteractable', { id: found })
    }
  }

  update(time: number, delta: number): void {
    if (!this.player) return
    this.player.move(this.cursors, this.wasd, delta)
    this.npcs.forEach((npc) => npc.update(delta))
    this.dayNightSystem.update(delta)
    this.checkNearbyInteractables()
  }

  shutdown(): void {
    this.eventCleanups.forEach((fn) => fn())
    this.eventCleanups = []
  }
}
