import * as Phaser from 'phaser'
import { Player } from '../objects/Player'
import { NPC } from '../objects/NPC'
import { PlantSprite } from '../objects/PlantSprite'
import { WeatherSystem } from '../systems/WeatherSystem'
import { DayNightSystem } from '../systems/DayNightSystem'
import { EventBridge } from '../EventBridge'
import { useGameStore } from '@/lib/gameStore'
import { TERRAIN, WATER, SOIL, FENCE } from '../utils/CozyValleyLoader'
import {
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, MAP_DATA, TILES,
  NPC_POSITIONS, HOUSE_POSITION, POND_POSITION, GARDEN_ORIGIN, PLAYER_START,
  COW_FARM_ORIGIN, DUCK_ZONE_ORIGIN, DUCK_POND,
} from './BootScene'
import type { Plant, WeatherState } from '@/lib/types'

interface InteractionZone {
  id: string
  bounds: Phaser.Geom.Rectangle
}

export class FarmScene extends Phaser.Scene {
  private player!: Player
  private npcs: NPC[] = []
  private plantSprites: Map<string, PlantSprite> = new Map()
  private weatherSystem!: WeatherSystem
  private dayNightSystem!: DayNightSystem
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key }
  private mobileInputs = { up: false, down: false, left: false, right: false }
  private eKey!: Phaser.Input.Keyboard.Key
  private jKey!: Phaser.Input.Keyboard.Key
  private escKey!: Phaser.Input.Keyboard.Key
  private interactionZones: InteractionZone[] = []
  private collisionRects: Phaser.GameObjects.Rectangle[] = []
  private butterflies: Phaser.GameObjects.Image[] = []
  private eventCleanups: Array<() => void> = []
  private currentNearby: string | null = null
  private animals: Phaser.GameObjects.Sprite[] = []
  private initialPlants: Plant[] = []
  private bgMusic: Phaser.Sound.BaseSound | null = null

  constructor() { super({ key: 'FarmScene' }) }

  init(data: { plants?: Plant[]; avatar?: string; unlockedItems?: string[] }): void {
    this.initialPlants = data?.plants || []
    if (data?.avatar) (this as unknown as Record<string, unknown>)._pendingAvatar = data.avatar
    if (data?.unlockedItems) (this as unknown as Record<string, unknown>)._pendingUnlocks = data.unlockedItems
  }

  create(): void {
    // _pendingAvatar is set when avatarChanged EventBridge event triggers scene.restart()
    // _initData.avatar is set by AvatarPickerOverlay directly on the Phaser game object
    // as a reliable fallback when EventBridge fires before FarmScene has registered its listener
    const pendingAvatar = (this as unknown as Record<string, unknown>)._pendingAvatar as string | undefined
    const initDataAvatar = ((this.game as unknown as Record<string, unknown>)._initData as Record<string, unknown> | undefined)?.avatar as string | undefined
    const avatar = pendingAvatar ?? initDataAvatar ?? 'farmer_girl'
    const unlockedItems = ((this as unknown as Record<string, unknown>)._pendingUnlocks as string[]) || []

    this.renderTilemap()
    this.renderFences()
    this.renderStructures()
    this.renderCrops()
    this.renderTrees()
    this.renderFlowers()
    this.renderFarmProps()
    this.renderBoats()

    const px = PLAYER_START.x * TILE_SIZE + TILE_SIZE / 2
    const py = PLAYER_START.y * TILE_SIZE + TILE_SIZE
    this.player = new Player(this, px, py, avatar)

    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(2.5)

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

    this.setupCollisions()
    this.createNPCs()
    this.createAnimals(avatar)
    this.createInteractionZones()

    this.initialPlants.forEach((p) => this.spawnPlant(p))

    // Render Pink Cherry trees for each completed journal entry
    const journalCount = useGameStore.getState().entryCount || useGameStore.getState().localEntries.length
    if (journalCount > 0) {
      this.spawnCherryTreeReward(0, false)
    }

    this.spawnDecorations(unlockedItems)

    this.weatherSystem = new WeatherSystem(this)
    this.dayNightSystem = new DayNightSystem(this)

    if (unlockedItems.includes('fireflies')) this.dayNightSystem.setHasFireflies(true)
    if (unlockedItems.includes('butterflies')) this.spawnButterflies()

    this.setupEventListeners()

    this.eKey.on('down', () => this.handleInteract())
    this.jKey.on('down', () => EventBridge.emit('openJournal', undefined as unknown as void))
  }

  // ─── Tilemap ───────────────────────────────────────────────────────────────

  private renderTilemap(): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tileId = MAP_DATA[y][x]
        const wx = x * TILE_SIZE + TILE_SIZE / 2
        const wy = y * TILE_SIZE + TILE_SIZE / 2
        this.placeTile(tileId, wx, wy, x, y)
      }
    }
  }

  private placeTile(tileId: number, wx: number, wy: number, x: number, y: number): void {
    let key: string
    let frame: number

    if (tileId >= 100) {
      key = 'terrain'
      frame = tileId - 100
    } else {
      switch (tileId) {
        case TILES.GRASS:
          key = 'terrain'
          const hash = (x * 3 + y * 7) % 10
          if (hash === 0 || hash === 1) frame = TERRAIN.GRASS_DARK
          else if (hash === 2) frame = TERRAIN.GRASS_LIGHT
          else frame = TERRAIN.GRASS
          break
        case TILES.DIRT:
        case TILES.PATH:
          key = 'terrain'; frame = TERRAIN.DIRT; break
        case TILES.SOIL:
          key = 'soil_ss'; frame = SOIL.PLAIN; break
        case TILES.WATER:
        case TILES.WATER_N: case TILES.WATER_S:
        case TILES.WATER_E: case TILES.WATER_W:
        case TILES.WATER_NE: case TILES.WATER_NW:
        case TILES.WATER_SE: case TILES.WATER_SW:
          key = 'water_ss'; frame = WATER.CENTER; break
        default:
          key = 'terrain'; frame = TERRAIN.GRASS
      }
    }

    const img = this.add.image(wx, wy, key, frame)
    img.setDepth(0)
  }

  // ─── Fences ────────────────────────────────────────────────────────────────

  private renderFences(): void {
    // COW FARM: outer perimeter at COW_FARM_ORIGIN, 14 wide × 11 tall. Opens at south bottom edge (x: 10, y: 13)
    this.fenceBox(COW_FARM_ORIGIN.x, COW_FARM_ORIGIN.y, 14, 11, [{ x: 10, y: 13 }])

    // FLOWER GARDEN: outer perimeter at GARDEN_ORIGIN, 15 wide × 13 tall. Opens at right side (x: 18, y: 25)
    this.fenceBox(GARDEN_ORIGIN.x, GARDEN_ORIGIN.y, 15, 13, [{ x: 18, y: 25 }])

    // DUCK POOL ZONE: outer perimeter at DUCK_ZONE_ORIGIN, 17 wide × 15 tall. Opens at left top
    this.fenceBox(DUCK_ZONE_ORIGIN.x, DUCK_ZONE_ORIGIN.y, 17, 15, [{ x: 20, y: 20 }, { x: 20, y: 21 }])
  }

  private fenceBox(ox: number, oy: number, w: number, h: number, openings: { x: number, y: number }[] = []): void {
    const maxX = ox + w - 1
    const maxY = oy + h - 1

    // Corners
    this.addFence(ox, oy, FENCE.CORNER_TL)
    this.addFence(maxX, oy, FENCE.CORNER_TR)
    this.addFence(ox, maxY, FENCE.CORNER_BL)
    this.addFence(maxX, maxY, FENCE.CORNER_BR)

    // Horizontal rails
    for (let x = ox + 1; x < maxX; x++) {
      if (!openings.some(o => o.x === x && o.y === oy)) this.addFence(x, oy, FENCE.H_TOP)
      if (!openings.some(o => o.x === x && o.y === maxY)) this.addFence(x, maxY, FENCE.H_BOTTOM)
    }

    // Vertical rails
    for (let y = oy + 1; y < maxY; y++) {
      if (!openings.some(o => o.x === ox && o.y === y)) this.addFence(ox, y, FENCE.V_LEFT)
      if (!openings.some(o => o.x === maxX && o.y === y)) this.addFence(maxX, y, FENCE.V_RIGHT)
    }
  }

  private addFence(tileX: number, tileY: number, frame: number): void {
    const img = this.add.image(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE + TILE_SIZE / 2,
      'fence_ss', frame
    )
    img.setDepth(2)
  }

  private spawnCherryTreeReward(index: number, animate = false): void {
    // Top border of garden is Y=20. Garden stretches from X=14 to X=28.
    // Grow trees along the top fence X=21, expanding outwards logic.
    const startX = 21
    const startY = 19
    // Math pattern: 0, 1, -1, 2, -2, 3, -3...
    const offset = Math.ceil(index / 2) * (index % 2 !== 0 ? 1 : -1)
    // If they write > 15 entries, stack them a row higher
    const row = Math.floor(index / 15)

    const tx = startX + offset
    const ty = startY - row

    const rewardTree = this.add.image(
      tx * TILE_SIZE + TILE_SIZE / 2,
      ty * TILE_SIZE + TILE_SIZE,
      'tree_cherry'
    )
    rewardTree.setDepth(3).setOrigin(0.5, 1)

    if (animate) {
      rewardTree.y -= 20
      rewardTree.alpha = 0
      this.tweens.add({
        targets: rewardTree,
        y: '+=20',
        alpha: 1,
        duration: 800,
        ease: 'Bounce.easeOut'
      })
    }
  }

  // ─── Structures & Trees & Crops ────────────────────────────────────────────

  private renderStructures(): void {
    const barn = this.add.image(10 * TILE_SIZE, 6 * TILE_SIZE, 'barn')
    barn.setOrigin(0.5, 1)
    barn.setDepth(3)

    // Lanterns flanking barn door (procedural, generated in BootScene)
    if (this.textures.exists('lantern')) {
      ;[{ x: HOUSE_POSITION.x - 1, y: HOUSE_POSITION.y + 3 },
      { x: HOUSE_POSITION.x + 3, y: HOUSE_POSITION.y + 3 }].forEach(({ x, y }) => {
        const l = this.add.image(x * TILE_SIZE + 8, y * TILE_SIZE + 8, 'lantern')
        l.setDepth(3)
      })
    }
  }

  private renderCrops(): void {
    // Top-Left (carrots)
    for (let y = 21; y <= 24; y++) {
      for (let x = 6; x <= 10; x++) {
        const crop = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'crop_carrot', 5) // Mature frame
        crop.setDepth(2)
      }
    }
    // Top-Right (potatoes)
    for (let y = 21; y <= 24; y++) {
      for (let x = 12; x <= 16; x++) {
        const crop = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'crop_potato', 5)
        crop.setDepth(2)
      }
    }
    // Bottom-Left (pumpkins)
    for (let y = 27; y <= 30; y++) {
      for (let x = 6; x <= 10; x++) {
        const crop = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'crop_pumpkin', 5)
        crop.setDepth(2)
      }
    }
    // Bottom-Right (sunflowers)
    for (let y = 27; y <= 30; y++) {
      for (let x = 12; x <= 16; x++) {
        const crop = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'crop_sunflower', 5)
        crop.setDepth(2)
      }
    }
  }

  // ─── Trees ─────────────────────────────────────────────────────────────────

  private renderTrees(): void {
    // Trees removed per user request — keeping method for future use
  }

  // ─── Decorations ───────────────────────────────────────────────────────────

  private renderFlowers(): void {
    // Scatter some flowers randomly in grassland areas where no other structure is present
    for (let y = 2; y < MAP_HEIGHT - 2; y++) {
      for (let x = 2; x < MAP_WIDTH - 2; x++) {
        if (MAP_DATA[y][x] === TILES.GRASS && Math.random() < 0.05) {
          const wx = x * TILE_SIZE + TILE_SIZE / 2
          const wy = y * TILE_SIZE + TILE_SIZE / 2
          const frame = Phaser.Math.Between(0, 15) // Flowers.png 16 frames
          const img = this.add.image(wx, wy, 'flowers_ss', frame)
          img.setDepth(1)
        }
      }
    }
  }

  private renderFarmProps(): void {
    const T = TILE_SIZE

    // ── Watering can by the garden (farmprops_ss frame 2) ─────────────────────
    const can = this.add.image(GARDEN_ORIGIN.x * T - T * 2, GARDEN_ORIGIN.y * T + T * 2, 'farmprops_ss', 2)
    can.setDepth(2)

  }

  private renderBoats(): void {
    // Boats are 48x32 (3 tiles wide, 2 tiles tall) 
    const boats = [
      { x: 10, y: 1, frame: 0 },
      { x: 25, y: 33, frame: 1 },
    ]
    boats.forEach(b => {
      const img = this.add.image(b.x * TILE_SIZE + 24, b.y * TILE_SIZE + 16, 'boats_ss', b.frame)
      img.setDepth(2)
    })
  }

  // ─── Animals ───────────────────────────────────────────────────────────────

  private createAnimals(playerAvatar: string): void {
    // COW FARM zone (x=[4,15], y=[4,12]) -> strict pixel bounds
    const cowMinX = 5 * TILE_SIZE, cowMaxX = 15 * TILE_SIZE
    const cowMinY = 5 * TILE_SIZE, cowMaxY = 12 * TILE_SIZE

    // Always show brownwhite NPC cows — player cow is black/white (cow_bw_ss) so no visual conflict
    this.spawnAnimal('cow_ss', 6 * TILE_SIZE + 16, 6 * TILE_SIZE + 16, 40, 25, cowMinX, cowMaxX, cowMinY, cowMaxY)
    this.spawnAnimal('cow_ss', 11 * TILE_SIZE + 16, 9 * TILE_SIZE + 16, 40, 25, cowMinX, cowMaxX, cowMinY, cowMaxY)
    this.spawnAnimal('cow_ss', 8 * TILE_SIZE + 16, 11 * TILE_SIZE + 16, 40, 25, cowMinX, cowMaxX, cowMinY, cowMaxY)
    this.spawnAnimal('chicken_ss', 5 * TILE_SIZE + 8, 5 * TILE_SIZE + 8, 20, 20, cowMinX, cowMaxX, cowMinY, cowMaxY)
    this.spawnAnimal('chicken_ss', 13 * TILE_SIZE + 8, 11 * TILE_SIZE + 8, 20, 20, cowMinX, cowMaxX, cowMinY, cowMaxY)
    this.spawnAnimal('chicken_ss', 9 * TILE_SIZE + 8, 7 * TILE_SIZE + 8, 20, 20, cowMinX, cowMaxX, cowMinY, cowMaxY)

    // DUCK POOL ZONE (x=[21, 35], y=[18, 29]) -> strict pixel bounds
    const pondMinX = 22 * TILE_SIZE, pondMaxX = 35 * TILE_SIZE
    const pondMinY = 19 * TILE_SIZE, pondMaxY = 30 * TILE_SIZE

    this.spawnAnimal('duck_mallard', 22 * TILE_SIZE + 8, 20 * TILE_SIZE + 8, 60, 20, pondMinX, pondMaxX, pondMinY, pondMaxY)
    this.spawnAnimal('duck_white', 25 * TILE_SIZE + 8, 21 * TILE_SIZE + 8, 60, 20, pondMinX, pondMaxX, pondMinY, pondMaxY)
    this.spawnAnimal('duck_mallard', 24 * TILE_SIZE + 8, 24 * TILE_SIZE + 8, 50, 20, pondMinX, pondMaxX, pondMinY, pondMaxY)
    this.spawnAnimal('goose_white', 30 * TILE_SIZE + 8, 22 * TILE_SIZE + 8, 70, 20, pondMinX, pondMaxX, pondMinY, pondMaxY)
    this.spawnAnimal('duck_white', 28 * TILE_SIZE + 8, 26 * TILE_SIZE + 8, 60, 20, pondMinX, pondMaxX, pondMinY, pondMaxY)
    this.spawnAnimal('duck_mallard', 33 * TILE_SIZE + 8, 25 * TILE_SIZE + 8, 50, 20, pondMinX, pondMaxX, pondMinY, pondMaxY)
    this.spawnAnimal('goose_white', 26 * TILE_SIZE + 8, 28 * TILE_SIZE + 8, 60, 20, pondMinX, pondMaxX, pondMinY, pondMaxY)
  }

  private spawnAnimal(
    key: string,
    wx: number, wy: number,
    wanderRadius: number,
    wanderInterval: number,
    minX?: number, maxX?: number,
    minY?: number, maxY?: number
  ): void {
    const sprite = this.add.sprite(wx, wy, key, 0)
    sprite.setDepth(4)
    sprite.setOrigin(0.5, 0.5)
    this.animals.push(sprite)

    const idleKey = `${key}_idle`
    if (this.anims.exists(idleKey)) sprite.play(idleKey)

    // Simple wander
    let timer = 0
    let target = { x: wx, y: wy }
    let dir: 'down' | 'left' | 'right' | 'up' = 'down'

    this.events.on('update', (_t: number, delta: number) => {
      if (!sprite.active) return
      timer += delta / 1000

      if (timer >= wanderInterval + Math.random() * 10) {
        timer = 0
        const angle = Math.random() * Math.PI * 2
        const dist = Math.random() * wanderRadius
        target = {
          x: Phaser.Math.Clamp(
            wx + Math.cos(angle) * dist,
            minX ?? wx - wanderRadius,
            maxX ?? wx + wanderRadius
          ),
          y: Phaser.Math.Clamp(
            wy + Math.sin(angle) * dist,
            minY ?? wy - wanderRadius,
            maxY ?? wy + wanderRadius
          ),
        }
      }

      const dx = target.x - sprite.x
      const dy = target.y - sprite.y
      const distToTarget = Math.sqrt(dx * dx + dy * dy)

      if (distToTarget > 2) {
        const speed = (key.includes('chicken') || key.includes('duck') || key.includes('goose')) ? 18 : 12
        sprite.x += (dx / distToTarget) * speed * (delta / 1000)
        sprite.y += (dy / distToTarget) * speed * (delta / 1000)

        // Pick walk animation direction
        const newDir: typeof dir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up')

        if (newDir !== dir) {
          dir = newDir
          const walkKey = `${key}_walk_${dir}`
          if (this.anims.exists(walkKey)) sprite.play(walkKey, true)
        }
      } else {
        if (this.anims.exists(idleKey) && sprite.anims.currentAnim?.key !== idleKey) {
          sprite.play(idleKey, true)
        }
      }
    })
  }

  // ─── Collisions ────────────────────────────────────────────────────────────

  private setupCollisions(): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (MAP_DATA[y][x] !== TILES.WATER) continue
        const rect = this.add.rectangle(
          x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2,
          TILE_SIZE, TILE_SIZE, 0x000000, 0
        )
        this.physics.add.existing(rect, true)
        this.collisionRects.push(rect)
        this.physics.add.collider(this.player, rect)
      }
    }

    // Barn collision box
    const barnRect = this.add.rectangle(
      HOUSE_POSITION.x * TILE_SIZE + 48,
      HOUSE_POSITION.y * TILE_SIZE + 32,
      96, 48, 0, 0
    )
    this.physics.add.existing(barnRect, true)
    this.physics.add.collider(this.player, barnRect)
  }

  // ─── NPCs ──────────────────────────────────────────────────────────────────

  private createNPCs(): void {
    const npcConfigs = [
      { id: 'guide', x: HOUSE_POSITION.x + 6, y: HOUSE_POSITION.y + 4, textureKey: 'char2', message: "Welcome to your Mindful Farm! Walk to the barn to write reflections, or visit the pond for breathing exercises.", patrolRadius: 30 },
      { id: 'gardener', x: 29, y: 7, textureKey: 'char4', message: "Every feeling you write becomes a seed. Your garden grows with your heart!", patrolRadius: 20 },
      { id: 'neighbor', x: 23, y: 16, textureKey: 'char5', message: "I've been tending this land for years. The secret? Show up, even on cloudy days.", patrolRadius: 40 },
    ]
    npcConfigs.forEach((cfg) => {
      this.npcs.push(new NPC(this, {
        id: cfg.id,
        x: cfg.x * TILE_SIZE + 8,
        y: cfg.y * TILE_SIZE + 16,
        textureKey: cfg.textureKey,
        message: cfg.message,
        patrolRadius: cfg.patrolRadius
      }))
    })
  }

  // ─── Interaction zones ─────────────────────────────────────────────────────

  private createInteractionZones(): void {
    const barnDoorX = HOUSE_POSITION.x * TILE_SIZE + 48
    const barnDoorY = HOUSE_POSITION.y * TILE_SIZE + 56

    this.interactionZones = [
      { id: 'journal_house', bounds: new Phaser.Geom.Rectangle(barnDoorX - 24, barnDoorY - 16, 48, 24) },
      { id: 'pond', bounds: new Phaser.Geom.Rectangle(DUCK_POND.x * TILE_SIZE - 8, DUCK_POND.y * TILE_SIZE - 8, DUCK_POND.w * TILE_SIZE + 16, DUCK_POND.h * TILE_SIZE + 16) },
      { id: 'garden', bounds: new Phaser.Geom.Rectangle(GARDEN_ORIGIN.x * TILE_SIZE - 4, GARDEN_ORIGIN.y * TILE_SIZE - 4, 13 * TILE_SIZE + 8, 13 * TILE_SIZE + 8) },
    ]

    this.npcs.forEach((npc) => {
      this.interactionZones.push({ id: `npc_${npc.npcId}`, bounds: new Phaser.Geom.Rectangle(npc.x - 20, npc.y - 20, 40, 40) })
    })
  }

  // ─── Plants ────────────────────────────────────────────────────────────────

  private spawnPlant(plant: Plant): void {
    if (this.plantSprites.has(plant.id)) return
    const px = plant.tile_x * TILE_SIZE + TILE_SIZE / 2
    const py = plant.tile_y * TILE_SIZE + TILE_SIZE
    this.plantSprites.set(plant.id, new PlantSprite(this, plant, px, py))
  }

  // ─── Decorations ───────────────────────────────────────────────────────────

  private spawnDecorations(unlockedItems: string[]): void {
    if (unlockedItems.includes('butterflies')) this.spawnButterflies()
    if (unlockedItems.includes('lantern_decor') && this.textures.exists('lantern')) {
      const l = this.add.image((GARDEN_ORIGIN.x + 5) * TILE_SIZE, GARDEN_ORIGIN.y * TILE_SIZE, 'lantern')
      l.setDepth(3)
    }
  }

  private spawnButterflies(): void {
    if (!this.textures.exists('butterfly_0')) return
    for (let i = 0; i < 4; i++) {
      const bx = (GARDEN_ORIGIN.x + Math.random() * 6) * TILE_SIZE
      const by = (GARDEN_ORIGIN.y + Math.random() * 6) * TILE_SIZE
      const bf = this.add.image(bx, by, `butterfly_${i % 2}`)
      bf.setDepth(6)
      this.butterflies.push(bf)
      this.tweens.add({
        targets: bf,
        x: bx + Phaser.Math.Between(-30, 30),
        y: by + Phaser.Math.Between(-20, 20),
        duration: 1500 + i * 300,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        onRepeat: () => bf.setTexture(`butterfly_${Math.floor(Math.random() * 2)}`),
      })
    }
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  private setupEventListeners(): void {
    // Journal / Plant creation
    const cleanPlantAdded = EventBridge.on('plantAdded', (plant) => {
      const existing = [...this.plantSprites.values()].find(
        (s) => s.plantData.tile_x === plant.tile_x && s.plantData.tile_y === plant.tile_y
      )
      if (existing) existing.advanceStage()
      else this.spawnPlant(plant)
    })

    const cleanJournalCompleted = EventBridge.on('journalCompleted', () => {
      // Only spawn the first one live if they didn't have any before
      const count = useGameStore.getState().entryCount || useGameStore.getState().localEntries.length
      if (count === 1) {
        this.spawnCherryTreeReward(0, true)
      }
    })

    const cleanWeather = EventBridge.on('weatherChanged', (weather: WeatherState) => {
      this.weatherSystem.setWeather(weather)
    })

    const cleanGrowth = EventBridge.on('growthBoost', () => {
      this.plantSprites.forEach((sprite) => {
        this.tweens.add({ targets: sprite, scaleX: 1.3, scaleY: 1.3, duration: 300, yoyo: true, ease: 'Back.easeOut' })
        sprite.playSparkle()
      })
    })

    const cleanDayNight = EventBridge.on('dayNightTick', ({ phase }) => {
      this.weatherSystem.applyDayNightPhase(phase)
    })

    // Avatar picker fires this after user confirms their choice — restart scene with new avatar
    const cleanAvatarChanged = EventBridge.on('avatarChanged', ({ avatar }) => {
      this.scene.restart({ avatar, plants: this.initialPlants })
    })

    // Listen to mobile custom events coming from React DOM
    const handleMobileInput = (e: Event) => {
      const ce = e as CustomEvent
      if (ce.detail.type === 'dir') {
        const dir = ce.detail.dir as keyof typeof this.mobileInputs
        if (dir) this.mobileInputs[dir] = ce.detail.isDown
      } else if (ce.detail.type === 'interact') {
        if (ce.detail.isDown) this.handleInteract()
      }
    }
    window.addEventListener('mobile-input', handleMobileInput)
    const cleanMobileInputs = () => window.removeEventListener('mobile-input', handleMobileInput)

    this.eventCleanups.push(cleanPlantAdded, cleanJournalCompleted, cleanWeather, cleanGrowth, cleanDayNight, cleanAvatarChanged, cleanMobileInputs)
  }

  private handleInteract(): void {
    if (!this.player) return
    const pt = new Phaser.Geom.Point(this.player.x, this.player.y)

    // 1. Check for interactive map zones first
    for (const zone of this.interactionZones) {
      if (!Phaser.Geom.Rectangle.ContainsPoint(zone.bounds, pt)) continue

      if (zone.id === 'journal_house' || zone.id === 'garden') {
        EventBridge.emit('openJournal', undefined as unknown as void)
      } else if (zone.id === 'pond') {
        EventBridge.emit('openBreathing', undefined as unknown as void)
      } else if (zone.id.startsWith('npc_')) {
        const npcId = zone.id.replace('npc_', '')
        const npc = this.npcs.find((n) => n.npcId === npcId)
        if (npc) {
          EventBridge.emit('talkNPC', { npcId, message: npc.message })
          EventBridge.emit('questProgress', { questKey: 'meet_guide', progress: 1, completed: npcId === 'guide' })
        }
      }
      return // Ensure we only trigger 1 interaction max per press
    }

    // 2. Fallback to check for roaming animals if no interactionZone triggered
    let closestAnimal: Phaser.GameObjects.Sprite | null = null
    let minDist = 40 // Interaction radius
    for (const animal of this.animals) {
      if (!animal.active) continue
      const dist = Phaser.Math.Distance.Between(pt.x, pt.y, animal.x, animal.y)
      if (dist < minDist) {
        minDist = dist
        closestAnimal = animal
      }
    }

    if (closestAnimal) {
      // Small hop animation and a floating heart
      this.tweens.add({
        targets: closestAnimal,
        y: '-=15',
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeInOut'
      })

      const heart = this.add.text(closestAnimal.x, closestAnimal.y - 20, '❤️', { fontSize: '16px', resolution: 2 }).setOrigin(0.5)
      heart.setDepth(10)
      this.tweens.add({
        targets: heart,
        y: '-=20',
        alpha: 0,
        duration: 1000,
        onComplete: () => heart.destroy()
      })
    }
  }

  private checkNearbyInteractables(): void {
    if (!this.player) return
    const pt = new Phaser.Geom.Point(this.player.x, this.player.y)
    const expand = (r: Phaser.Geom.Rectangle) => new Phaser.Geom.Rectangle(r.x - 12, r.y - 12, r.width + 24, r.height + 24)

    let found: string | null = null
    for (const zone of this.interactionZones) {
      if (Phaser.Geom.Rectangle.ContainsPoint(expand(zone.bounds), pt)) { found = zone.id; break }
    }

    if (found !== this.currentNearby) {
      this.currentNearby = found
      EventBridge.emit('nearbyInteractable', { id: found })
    }
  }

  // ─── Update / Shutdown ─────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (!this.player) return
    this.player.move(this.cursors, this.wasd, this.mobileInputs, delta)
    this.npcs.forEach((npc) => npc.update(delta))
    this.dayNightSystem.update(delta)
    this.checkNearbyInteractables()
  }

  shutdown(): void {
    this.eventCleanups.forEach((fn) => fn())
    this.eventCleanups = []
    if (this.bgMusic) { this.bgMusic.stop(); this.bgMusic = null }
  }
}
