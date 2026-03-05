import type Phaser from 'phaser'

export class ProceduralAssets {
  static generate(scene: Phaser.Scene): void {
    ProceduralAssets.generateTiles(scene)
    ProceduralAssets.generatePlants(scene)
    ProceduralAssets.generatePlayer(scene)
    ProceduralAssets.generateNPCs(scene)
    ProceduralAssets.generateDecorations(scene)
    ProceduralAssets.generateParticles(scene)
    ProceduralAssets.generateUI(scene)
  }

  private static drawPixel(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: number,
    size = 1
  ): void {
    gfx.fillStyle(color, 1)
    gfx.fillRect(x, y, size, size)
  }

  static generateTiles(scene: Phaser.Scene): void {
    const tileSize = 16

    // --- Grass tile: bright mint-green with flower dots ---
    const grassGfx = scene.add.graphics()
    grassGfx.fillStyle(0x8ed85a, 1)
    grassGfx.fillRect(0, 0, tileSize, tileSize)
    // Subtle darker patches
    grassGfx.fillStyle(0x7ec84a, 1)
    grassGfx.fillRect(1, 7, 4, 3)
    grassGfx.fillRect(10, 2, 3, 3)
    // Flower dots (tiny white/yellow)
    const flowerDots: [number, number, number][] = [
      [2, 3, 0xffffd0], [6, 11, 0xffffd0], [11, 5, 0xffd0f0], [13, 13, 0xffffd0]
    ]
    flowerDots.forEach(([fx, fy, fc]) => {
      grassGfx.fillStyle(fc, 1)
      grassGfx.fillRect(fx, fy, 2, 2)
    })
    ProceduralAssets.saveTexture(scene, grassGfx, 'tile_grass', tileSize, tileSize)

    // --- Water tile: deep teal-blue with shimmer ---
    const waterGfx = scene.add.graphics()
    waterGfx.fillStyle(0x4ab8d4, 1)
    waterGfx.fillRect(0, 0, tileSize, tileSize)
    // Lighter diagonal shimmer lines
    waterGfx.fillStyle(0x70d8f0, 0.7)
    waterGfx.fillRect(2, 2, 5, 1)
    waterGfx.fillRect(3, 3, 4, 1)
    waterGfx.fillRect(10, 9, 4, 1)
    waterGfx.fillRect(9, 10, 5, 1)
    waterGfx.fillRect(1, 13, 3, 1)
    ProceduralAssets.saveTexture(scene, waterGfx, 'tile_water', tileSize, tileSize)

    // --- Soil tile: rich auburn with furrow lines ---
    const soilGfx = scene.add.graphics()
    soilGfx.fillStyle(0xa0603a, 1)
    soilGfx.fillRect(0, 0, tileSize, tileSize)
    soilGfx.fillStyle(0x885030, 1)
    soilGfx.fillRect(0, 3, tileSize, 1)
    soilGfx.fillRect(0, 7, tileSize, 1)
    soilGfx.fillRect(0, 11, tileSize, 1)
    // Slight highlight on top
    soilGfx.fillStyle(0xb87050, 1)
    soilGfx.fillRect(0, 0, tileSize, 2)
    ProceduralAssets.saveTexture(scene, soilGfx, 'tile_soil', tileSize, tileSize)

    // --- Path tile: warm stone with cobblestone grid ---
    const pathGfx = scene.add.graphics()
    pathGfx.fillStyle(0xc8b090, 1)
    pathGfx.fillRect(0, 0, tileSize, tileSize)
    // Cobblestone mortar lines (2px gray grid creating ~6x6 squares)
    pathGfx.fillStyle(0xa89070, 1)
    pathGfx.fillRect(0, 0, tileSize, 1)      // top border
    pathGfx.fillRect(0, 7, tileSize, 1)       // h-center
    pathGfx.fillRect(0, 14, tileSize, 1)      // near bottom
    pathGfx.fillRect(0, 0, 1, tileSize)       // left border
    pathGfx.fillRect(7, 0, 1, tileSize)       // v-center
    pathGfx.fillRect(14, 0, 1, tileSize)      // near right
    // Slight stone color variation in cells
    pathGfx.fillStyle(0xd8c0a0, 1)
    pathGfx.fillRect(2, 2, 4, 4)
    pathGfx.fillRect(9, 2, 4, 4)
    pathGfx.fillRect(2, 9, 4, 4)
    pathGfx.fillRect(9, 9, 4, 4)
    ProceduralAssets.saveTexture(scene, pathGfx, 'tile_path', tileSize, tileSize)

    // --- Dirt tile: sandy tan with pebble dots ---
    const dirtGfx = scene.add.graphics()
    dirtGfx.fillStyle(0xd4a870, 1)
    dirtGfx.fillRect(0, 0, tileSize, tileSize)
    const pebbles: [number, number][] = [[3, 4], [8, 2], [12, 8], [5, 12], [10, 14]]
    pebbles.forEach(([px, py]) => {
      dirtGfx.fillStyle(0xb88850, 1)
      dirtGfx.fillRect(px, py, 2, 2)
    })
    ProceduralAssets.saveTexture(scene, dirtGfx, 'tile_dirt', tileSize, tileSize)

    // Water edge tiles
    const edges = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
    edges.forEach((dir) => {
      const edgeGfx = scene.add.graphics()
      edgeGfx.fillStyle(0x4ab8d4, 1)
      edgeGfx.fillRect(0, 0, tileSize, tileSize)
      edgeGfx.fillStyle(0x8ed85a, 1)
      if (dir.includes('n')) edgeGfx.fillRect(0, 0, tileSize, 4)
      if (dir.includes('s')) edgeGfx.fillRect(0, 12, tileSize, 4)
      if (dir.includes('w')) edgeGfx.fillRect(0, 0, 4, tileSize)
      if (dir.includes('e')) edgeGfx.fillRect(12, 0, 4, tileSize)
      ProceduralAssets.saveTexture(scene, edgeGfx, `tile_water_${dir}`, tileSize, tileSize)
    })
  }

  static generatePlants(scene: Phaser.Scene): void {
    const plantDefs: Array<{
      key: string
      colors: [number, number, number, number]
    }> = [
      { key: 'sunflower', colors: [0x8b5e3c, 0x90d050, 0xffcc00, 0xffaa00] },
      { key: 'daisy', colors: [0x8b5e3c, 0x90d050, 0xffffff, 0xffd0d0] },
      { key: 'lotus', colors: [0x4a9fd4, 0x50b060, 0xff80b0, 0xff40a0] },
      { key: 'lavender', colors: [0x8b5e3c, 0x90d050, 0xc080ff, 0x9040d0] },
      { key: 'oak_sapling', colors: [0x8b5e3c, 0x90d050, 0x60a840, 0x3a7828] },
    ]

    plantDefs.forEach(({ key, colors }) => {
      // Stage 0: seed
      const s0 = scene.add.graphics()
      s0.fillStyle(colors[0], 1)
      s0.fillRect(7, 12, 2, 4)
      s0.fillStyle(0x6b4020, 1)
      s0.fillEllipse(8, 13, 4, 3)
      ProceduralAssets.saveTexture(scene, s0, `${key}_0`, 16, 16)

      // Stage 1: sprout
      const s1 = scene.add.graphics()
      s1.fillStyle(colors[0], 1)
      s1.fillRect(7, 8, 2, 8)
      s1.fillStyle(colors[1], 1)
      s1.fillEllipse(6, 8, 6, 5)
      s1.fillEllipse(10, 9, 5, 4)
      ProceduralAssets.saveTexture(scene, s1, `${key}_1`, 16, 16)

      // Stage 2: flower
      const s2 = scene.add.graphics()
      s2.fillStyle(colors[0], 1)
      s2.fillRect(7, 6, 2, 10)
      s2.fillStyle(colors[1], 1)
      s2.fillRect(5, 10, 6, 4)
      s2.fillStyle(colors[2], 1)
      s2.fillEllipse(8, 6, 8, 8)
      ProceduralAssets.saveTexture(scene, s2, `${key}_2`, 16, 16)

      // Stage 3: bloom
      const s3 = scene.add.graphics()
      s3.fillStyle(colors[0], 1)
      s3.fillRect(7, 4, 2, 12)
      s3.fillStyle(colors[1], 1)
      s3.fillRect(4, 8, 8, 5)
      s3.fillStyle(colors[2], 1)
      s3.fillEllipse(8, 4, 10, 10)
      s3.fillStyle(colors[3], 1)
      s3.fillEllipse(8, 4, 6, 6)
      ProceduralAssets.saveTexture(scene, s3, `${key}_3`, 16, 16)
    })
  }

  static generatePlayer(scene: Phaser.Scene): void {
    const avatars = ['farmer_girl', 'farmer_boy', 'cow']
    const bodyColors: Record<string, number> = {
      farmer_girl: 0xf090a8,  // pink overalls
      farmer_boy: 0x5888d8,   // blue overalls
      cow: 0xffffff,
    }
    const hatColors: Record<string, number> = {
      farmer_girl: 0xe8d060,  // straw hat
      farmer_boy: 0xe8d060,   // straw hat
      cow: 0xffffff,
    }
    const dirs = ['down', 'up', 'left', 'right']

    avatars.forEach((avatar) => {
      const bodyColor = bodyColors[avatar]
      const hatColor = hatColors[avatar]
      dirs.forEach((dir) => {
        for (let frame = 0; frame < 3; frame++) {
          const gfx = scene.add.graphics()

          // Shadow
          gfx.fillStyle(0x000000, 0.18)
          gfx.fillEllipse(8, 15, 10, 4)

          if (avatar === 'cow') {
            // Cow body
            gfx.fillStyle(0xffffff, 1)
            gfx.fillRect(3, 5, 10, 9)
            // Cow spots
            gfx.fillStyle(0x222222, 1)
            gfx.fillRect(4, 5, 3, 4)
            gfx.fillRect(9, 7, 3, 3)
            // Head (chibi big)
            gfx.fillStyle(0xffffff, 1)
            gfx.fillRect(2, 0, 12, 8)
            gfx.fillStyle(0x222222, 1)
            gfx.fillRect(5, 1, 2, 2)
            gfx.fillRect(9, 1, 2, 2)
            // Eyes
            gfx.fillStyle(0x222222, 1)
            gfx.fillRect(5, 4, 2, 2)
            gfx.fillRect(9, 4, 2, 2)
            // Horn nubs
            gfx.fillStyle(0xf0d080, 1)
            gfx.fillRect(3, 0, 2, 2)
            gfx.fillRect(11, 0, 2, 2)
            // Legs
            gfx.fillStyle(0xf0f0f0, 1)
            const legOff1 = frame === 0 ? -1 : frame === 2 ? 1 : 0
            const legOff2 = frame === 0 ? 1 : frame === 2 ? -1 : 0
            gfx.fillRect(4, 13, 3, 3 + legOff1)
            gfx.fillRect(9, 13, 3, 3 + legOff2)
          } else {
            // Farmer body (overalls)
            gfx.fillStyle(bodyColor, 1)
            gfx.fillRect(4, 7, 8, 7)
            // Bib detail
            gfx.fillStyle(bodyColor === 0xf090a8 ? 0xf0a8b8 : 0x78a8f0, 1)
            gfx.fillRect(5, 7, 6, 4)

            // Head (chibi — slightly bigger)
            gfx.fillStyle(0xffd5a0, 1)
            gfx.fillRect(3, 1, 10, 8)

            // Hair
            if (avatar === 'farmer_girl') {
              gfx.fillStyle(0xf0c840, 1)  // blonde
              gfx.fillRect(3, 1, 10, 2)
              gfx.fillRect(3, 1, 2, 6)
              gfx.fillRect(11, 1, 2, 6)
            } else {
              gfx.fillStyle(0x885020, 1)  // brown
              gfx.fillRect(3, 1, 10, 3)
            }

            // Straw hat
            gfx.fillStyle(hatColor, 1)
            gfx.fillRect(4, 0, 8, 3)   // crown
            gfx.fillRect(2, 2, 12, 2)  // brim
            // Hat band
            gfx.fillStyle(0xd09050, 1)
            gfx.fillRect(4, 2, 8, 1)

            // Direction indicator (eyes/facing)
            gfx.fillStyle(0x333333, 1)
            if (dir === 'down') {
              gfx.fillRect(5, 5, 2, 2)
              gfx.fillRect(9, 5, 2, 2)
            } else if (dir === 'left') {
              gfx.fillRect(4, 5, 2, 2)
            } else if (dir === 'right') {
              gfx.fillRect(10, 5, 2, 2)
            }

            // Legs with walk cycle
            gfx.fillStyle(avatar === 'farmer_girl' ? 0x7050a0 : 0x304880, 1)
            const legOffset1 = frame === 0 ? -2 : frame === 2 ? 2 : 0
            const legOffset2 = frame === 0 ? 2 : frame === 2 ? -2 : 0
            gfx.fillRect(4, 13, 3, 3 + legOffset1)
            gfx.fillRect(9, 13, 3, 3 + legOffset2)
          }

          ProceduralAssets.saveTexture(scene, gfx, `${avatar}_${dir}_${frame}`, 16, 16)
        }
      })
    })
  }

  static generateNPCs(scene: Phaser.Scene): void {
    const npcs = [
      { key: 'npc_guide', bodyColor: 0xf0f0ff, accentColor: 0x9090e0, hatColor: 0x7060c0 },
      { key: 'npc_gardener', bodyColor: 0x90e090, accentColor: 0x60b060, hatColor: 0x408048 },
      { key: 'npc_neighbor', bodyColor: 0xe090d0, accentColor: 0xc060a0, hatColor: 0x8040a0 },
    ]

    npcs.forEach(({ key, bodyColor, accentColor, hatColor }) => {
      for (let frame = 0; frame < 2; frame++) {
        const gfx = scene.add.graphics()

        // Shadow
        gfx.fillStyle(0x000000, 0.15)
        gfx.fillEllipse(8, 15, 10, 3)

        // Body
        gfx.fillStyle(bodyColor, 1)
        gfx.fillRect(4, 6, 8, 8)
        // Accent band/apron
        gfx.fillStyle(accentColor, 0.6)
        gfx.fillRect(5, 8, 6, 4)

        // Head (chibi)
        gfx.fillStyle(0xffd5a0, 1)
        gfx.fillRect(3, 1, 10, 8)

        // Hat
        gfx.fillStyle(hatColor, 1)
        gfx.fillRect(3, 0, 10, 3)
        gfx.fillRect(2, 2, 12, 2)

        // Eyes
        gfx.fillStyle(0x333333, 1)
        gfx.fillRect(5, 4, 2, 2)
        gfx.fillRect(9, 4, 2, 2)

        // Smile
        gfx.fillStyle(0x884020, 1)
        gfx.fillRect(6, 7, 4, 1)

        // Legs
        gfx.fillStyle(hatColor, 0.7)
        const bob = frame === 1 ? 1 : 0
        gfx.fillRect(4, 13 + bob, 3, 3)
        gfx.fillRect(9, 13, 3, 3 + bob)

        ProceduralAssets.saveTexture(scene, gfx, `${key}_${frame}`, 16, 16)
      }
    })
  }

  static generateDecorations(scene: Phaser.Scene): void {
    // --- Tree: layered fluffy crown (20x32) ---
    for (let frame = 0; frame < 2; frame++) {
      const gfx = scene.add.graphics()
      const sway = frame === 0 ? 0 : 1

      // Ground shadow
      gfx.fillStyle(0x000000, 0.15)
      gfx.fillEllipse(10, 30, 14, 5)

      // Trunk with highlight stripe
      gfx.fillStyle(0x8b5e3c, 1)
      gfx.fillRect(7, 18, 6, 14)
      gfx.fillStyle(0xa07050, 1)
      gfx.fillRect(8, 18, 2, 12)

      // Crown layer 1 (back/bottom — darkest)
      gfx.fillStyle(0x5a9e32, 1)
      gfx.fillCircle(10 + sway, 14, 10)

      // Crown layer 2 (mid)
      gfx.fillStyle(0x7ec850, 1)
      gfx.fillCircle(9 + sway, 11, 9)

      // Crown layer 3 (front/top — brightest)
      gfx.fillStyle(0xa0e050, 1)
      gfx.fillCircle(8 + sway, 8, 7)

      // Tiny highlight dot
      gfx.fillStyle(0xc0f070, 0.7)
      gfx.fillCircle(7 + sway, 6, 3)

      ProceduralAssets.saveTexture(scene, gfx, `tree_${frame}`, 20, 32)
    }

    // --- House (48x56): cute cozy pastel ---
    const houseGfx = scene.add.graphics()
    // Foundation
    houseGfx.fillStyle(0xe8d8c0, 1)
    houseGfx.fillRect(0, 24, 48, 32)
    // Walls: cream
    houseGfx.fillStyle(0xfaf0e0, 1)
    houseGfx.fillRect(2, 22, 44, 32)
    // Roof layer 1 (bottom, darkest)
    houseGfx.fillStyle(0xb86aa0, 1)
    houseGfx.fillTriangle(24, 0, 0, 24, 48, 24)
    // Roof layer 2 (shingles mid)
    houseGfx.fillStyle(0xd090c0, 1)
    houseGfx.fillTriangle(24, 2, 2, 21, 46, 21)
    // Roof layer 3 (shingles top)
    houseGfx.fillStyle(0xe8b4d8, 1)
    houseGfx.fillTriangle(24, 4, 6, 20, 42, 20)
    // Roof highlight ridge
    houseGfx.fillStyle(0xf0d0e8, 1)
    houseGfx.fillRect(22, 4, 4, 8)
    // Chimney
    houseGfx.fillStyle(0xa09080, 1)
    houseGfx.fillRect(36, 6, 6, 10)
    houseGfx.fillStyle(0x888070, 1)
    houseGfx.fillRect(36, 5, 6, 3)
    // Smoke puff hint
    houseGfx.fillStyle(0xd0d0d0, 0.5)
    houseGfx.fillCircle(39, 4, 3)
    // Door: arched-ish warm brown
    houseGfx.fillStyle(0xc47840, 1)
    houseGfx.fillRect(18, 36, 12, 18)
    houseGfx.fillStyle(0xd49050, 1)
    houseGfx.fillRect(19, 37, 10, 5)
    // Door arch top (rounded)
    houseGfx.fillStyle(0xc47840, 1)
    houseGfx.fillCircle(24, 36, 6)
    houseGfx.fillStyle(0xfaf0e0, 1)  // erase corners to make arch
    houseGfx.fillRect(18, 30, 4, 6)
    houseGfx.fillRect(26, 30, 4, 6)
    // Gold door knob
    houseGfx.fillStyle(0xffd700, 1)
    houseGfx.fillCircle(27, 45, 2)
    // Windows with cross-frame + flower box
    // Left window
    houseGfx.fillStyle(0x90d4ff, 1)
    houseGfx.fillRect(4, 26, 12, 10)
    houseGfx.fillStyle(0xc47840, 1)
    houseGfx.fillRect(9, 26, 2, 10)   // vertical frame
    houseGfx.fillRect(4, 30, 12, 2)   // horizontal frame
    houseGfx.fillRect(3, 25, 14, 2)   // top frame
    houseGfx.fillRect(3, 35, 14, 2)   // bottom frame
    // Left flower box
    houseGfx.fillStyle(0xa06040, 1)
    houseGfx.fillRect(3, 37, 14, 3)
    houseGfx.fillStyle(0xff8090, 1)
    houseGfx.fillRect(5, 35, 2, 3)
    houseGfx.fillStyle(0xffcc40, 1)
    houseGfx.fillRect(9, 35, 2, 3)
    houseGfx.fillStyle(0xff8090, 1)
    houseGfx.fillRect(13, 35, 2, 3)
    // Right window
    houseGfx.fillStyle(0x90d4ff, 1)
    houseGfx.fillRect(32, 26, 12, 10)
    houseGfx.fillStyle(0xc47840, 1)
    houseGfx.fillRect(37, 26, 2, 10)
    houseGfx.fillRect(32, 30, 12, 2)
    houseGfx.fillRect(31, 25, 14, 2)
    houseGfx.fillRect(31, 35, 14, 2)
    // Right flower box
    houseGfx.fillStyle(0xa06040, 1)
    houseGfx.fillRect(31, 37, 14, 3)
    houseGfx.fillStyle(0xffd0f0, 1)
    houseGfx.fillRect(33, 35, 2, 3)
    houseGfx.fillStyle(0x80ff80, 1)
    houseGfx.fillRect(37, 35, 2, 3)
    houseGfx.fillStyle(0xffd0f0, 1)
    houseGfx.fillRect(41, 35, 2, 3)
    // Sign above door
    houseGfx.fillStyle(0xd4a870, 1)
    houseGfx.fillRect(12, 22, 24, 6)
    houseGfx.fillStyle(0x804020, 1)
    houseGfx.fillRect(13, 23, 22, 4)
    ProceduralAssets.saveTexture(scene, houseGfx, 'house', 48, 56)

    // --- Pond (64x40): deeper, more vivid ---
    const pondGfx = scene.add.graphics()
    pondGfx.fillStyle(0x3aa8c4, 1)
    pondGfx.fillEllipse(32, 22, 60, 36)
    pondGfx.fillStyle(0x4ac8e8, 1)
    pondGfx.fillEllipse(26, 16, 22, 10)
    pondGfx.fillEllipse(44, 24, 14, 7)
    // Lily pads
    pondGfx.fillStyle(0x40b040, 0.8)
    pondGfx.fillCircle(16, 26, 5)
    pondGfx.fillCircle(48, 18, 4)
    pondGfx.fillStyle(0xff6080, 1)
    pondGfx.fillCircle(16, 24, 2)
    ProceduralAssets.saveTexture(scene, pondGfx, 'pond', 64, 40)

    // --- Fence ---
    const fenceGfx = scene.add.graphics()
    fenceGfx.fillStyle(0xd4b483, 1)
    fenceGfx.fillRect(0, 2, 4, 14)
    fenceGfx.fillRect(12, 2, 4, 14)
    fenceGfx.fillRect(0, 4, 16, 3)
    fenceGfx.fillRect(0, 10, 16, 3)
    fenceGfx.fillTriangle(2, 2, 4, 0, 6, 2)
    fenceGfx.fillTriangle(14, 2, 16, 0, 18, 2)
    ProceduralAssets.saveTexture(scene, fenceGfx, 'fence', 16, 16)

    // --- Lantern ---
    const lanternGfx = scene.add.graphics()
    lanternGfx.fillStyle(0xffd700, 1)
    lanternGfx.fillRect(6, 0, 4, 4)
    lanternGfx.fillStyle(0x888888, 1)
    lanternGfx.fillRect(4, 4, 8, 12)
    lanternGfx.fillStyle(0xffe080, 0.85)
    lanternGfx.fillRect(5, 5, 6, 10)
    lanternGfx.fillStyle(0x888888, 1)
    lanternGfx.fillRect(3, 15, 10, 2)
    ProceduralAssets.saveTexture(scene, lanternGfx, 'lantern', 16, 17)

    // --- Butterfly (2-frame): crisper wings ---
    for (let frame = 0; frame < 2; frame++) {
      const bGfx = scene.add.graphics()
      const spread = frame === 0 ? 1 : 0.65
      // Upper wings
      bGfx.fillStyle(0xff80c0, 0.95)
      bGfx.fillEllipse(5 * spread, 4, 9 * spread, 7)
      bGfx.fillEllipse(11 + (1 - spread) * 5, 5, 8 * spread, 6)
      // Lower wings (smaller)
      bGfx.fillStyle(0xff40a0, 1)
      bGfx.fillEllipse(5 * spread, 8, 6 * spread, 5)
      bGfx.fillEllipse(11 + (1 - spread) * 5, 9, 5 * spread, 4)
      // Wing pattern dots
      bGfx.fillStyle(0xffffff, 0.6)
      bGfx.fillCircle(Math.round(4 * spread), 4, 2)
      bGfx.fillCircle(Math.round(11 + (1 - spread) * 4), 5, 2)
      // Body
      bGfx.fillStyle(0x333333, 1)
      bGfx.fillRect(7, 2, 2, 10)
      // Antennae
      bGfx.fillStyle(0x555555, 1)
      bGfx.fillRect(6, 0, 1, 3)
      bGfx.fillRect(9, 0, 1, 3)
      ProceduralAssets.saveTexture(scene, bGfx, `butterfly_${frame}`, 16, 14)
    }

    // --- Bunny (2-frame): cuter ---
    for (let frame = 0; frame < 2; frame++) {
      const bunGfx = scene.add.graphics()
      bunGfx.fillStyle(0xf5f5f5, 1)
      // Body
      bunGfx.fillEllipse(8, 11, 12, 10)
      // Head
      bunGfx.fillEllipse(8, 6, 9, 9)
      // Ears
      bunGfx.fillStyle(0xf0f0f0, 1)
      bunGfx.fillRect(4, frame === 0 ? 0 : 1, 3, 6)
      bunGfx.fillRect(9, frame === 0 ? 0 : 1, 3, 6)
      bunGfx.fillStyle(0xffb0b0, 1)
      bunGfx.fillRect(5, frame === 0 ? 1 : 2, 1, 4)
      bunGfx.fillRect(10, frame === 0 ? 1 : 2, 1, 4)
      // Eyes
      bunGfx.fillStyle(0x333366, 1)
      bunGfx.fillRect(6, 5, 2, 2)
      bunGfx.fillRect(10, 5, 2, 2)
      // Nose
      bunGfx.fillStyle(0xff9090, 1)
      bunGfx.fillRect(7, 8, 2, 1)
      // Tail
      bunGfx.fillStyle(0xffffff, 1)
      bunGfx.fillCircle(8, 15, 2)
      ProceduralAssets.saveTexture(scene, bunGfx, `bunny_${frame}`, 16, 16)
    }

    // --- Duck (14x12, 2-frame): white oval body, orange bill ---
    for (let frame = 0; frame < 2; frame++) {
      const dGfx = scene.add.graphics()
      // Body
      dGfx.fillStyle(0xffffff, 1)
      dGfx.fillEllipse(7, 8, 12, 8)
      // Head
      dGfx.fillEllipse(11, 4, 6, 6)
      // Bill
      dGfx.fillStyle(0xff9020, 1)
      dGfx.fillRect(13, 4, 3, 2)
      // Eye
      dGfx.fillStyle(0x222222, 1)
      dGfx.fillRect(12, 3, 1, 1)
      // Feet alternate
      dGfx.fillStyle(0xff9020, 1)
      if (frame === 0) {
        dGfx.fillRect(4, 11, 3, 2)
        dGfx.fillRect(8, 11, 3, 2)
      } else {
        dGfx.fillRect(3, 10, 3, 2)
        dGfx.fillRect(7, 11, 3, 2)
      }
      ProceduralAssets.saveTexture(scene, dGfx, `duck_${frame}`, 14, 12)
    }

    // --- Fish (8x5, 2-frame): tiny colorful fish ---
    for (let frame = 0; frame < 2; frame++) {
      const fGfx = scene.add.graphics()
      // Body
      fGfx.fillStyle(0xff8040, 1)
      fGfx.fillEllipse(4, 3, 7, 4)
      // Tail
      fGfx.fillStyle(0xff6020, 1)
      if (frame === 0) {
        fGfx.fillTriangle(0, 1, 0, 5, 2, 3)
      } else {
        fGfx.fillTriangle(0, 2, 1, 5, 2, 3)
      }
      // Eye
      fGfx.fillStyle(0x222222, 1)
      fGfx.fillRect(5, 2, 1, 1)
      // Belly highlight
      fGfx.fillStyle(0xffd0a0, 0.6)
      fGfx.fillEllipse(4, 4, 4, 2)
      ProceduralAssets.saveTexture(scene, fGfx, `fish_${frame}`, 8, 5)
    }

    // --- Bird (8x6, 2-frame): V-shape wings ---
    for (let frame = 0; frame < 2; frame++) {
      const biGfx = scene.add.graphics()
      biGfx.fillStyle(0x444466, 1)
      if (frame === 0) {
        // Wings up (V shape)
        biGfx.fillRect(0, 2, 3, 2)
        biGfx.fillRect(5, 2, 3, 2)
        biGfx.fillRect(3, 1, 2, 2)
      } else {
        // Wings mid
        biGfx.fillRect(0, 3, 3, 2)
        biGfx.fillRect(5, 3, 3, 2)
        biGfx.fillRect(3, 2, 2, 2)
      }
      // Body dot
      biGfx.fillStyle(0x333344, 1)
      biGfx.fillRect(3, 3, 2, 2)
      ProceduralAssets.saveTexture(scene, biGfx, `bird_${frame}`, 8, 6)
    }

    // --- Cat (14x16, 2-frame): orange tabby ---
    for (let frame = 0; frame < 2; frame++) {
      const cGfx = scene.add.graphics()
      // Body
      cGfx.fillStyle(0xe87830, 1)
      cGfx.fillEllipse(7, 11, 10, 9)
      // Tabby stripes on body
      cGfx.fillStyle(0xc05818, 0.5)
      cGfx.fillRect(4, 9, 2, 4)
      cGfx.fillRect(8, 9, 2, 4)
      // Head
      cGfx.fillStyle(0xe87830, 1)
      cGfx.fillEllipse(7, 5, 10, 8)
      // Ears
      cGfx.fillStyle(0xe87830, 1)
      cGfx.fillTriangle(3, 4, 2, 0, 6, 2)
      cGfx.fillTriangle(11, 4, 12, 0, 8, 2)
      cGfx.fillStyle(0xffb0a0, 1)
      cGfx.fillTriangle(4, 3, 3, 1, 6, 2)
      cGfx.fillTriangle(10, 3, 11, 1, 8, 2)
      // Eyes
      cGfx.fillStyle(0x40c040, 1)
      cGfx.fillRect(4, 4, 2, 2)
      cGfx.fillRect(8, 4, 2, 2)
      cGfx.fillStyle(0x111111, 1)
      cGfx.fillRect(4, 4, 1, 2)
      cGfx.fillRect(8, 4, 1, 2)
      // Nose
      cGfx.fillStyle(0xff8080, 1)
      cGfx.fillRect(6, 6, 2, 1)
      // Tail (curled, different per frame)
      cGfx.fillStyle(0xe87830, 1)
      if (frame === 0) {
        cGfx.fillRect(12, 8, 2, 6)
        cGfx.fillRect(10, 13, 4, 2)
      } else {
        cGfx.fillRect(12, 9, 2, 5)
        cGfx.fillRect(11, 13, 3, 2)
      }
      ProceduralAssets.saveTexture(scene, cGfx, `cat_${frame}`, 14, 16)
    }

    // --- Flower patch (8x8): cluster of 3 flower heads ---
    const flowerGfx = scene.add.graphics()
    // Left flower (pink)
    flowerGfx.fillStyle(0xff90b0, 1)
    flowerGfx.fillCircle(2, 5, 3)
    flowerGfx.fillStyle(0xffee40, 1)
    flowerGfx.fillCircle(2, 5, 1)
    flowerGfx.fillStyle(0x508030, 1)
    flowerGfx.fillRect(2, 7, 1, 2)
    // Right flower (yellow)
    flowerGfx.fillStyle(0xffdd40, 1)
    flowerGfx.fillCircle(6, 4, 3)
    flowerGfx.fillStyle(0xff8020, 1)
    flowerGfx.fillCircle(6, 4, 1)
    flowerGfx.fillStyle(0x508030, 1)
    flowerGfx.fillRect(6, 6, 1, 2)
    // Center small flower (purple)
    flowerGfx.fillStyle(0xd080ff, 1)
    flowerGfx.fillCircle(4, 3, 2)
    flowerGfx.fillStyle(0xffffff, 1)
    flowerGfx.fillCircle(4, 3, 1)
    ProceduralAssets.saveTexture(scene, flowerGfx, 'flower_patch', 8, 8)

    // --- Mushroom (8x10): red cap with white dots ---
    const mushGfx = scene.add.graphics()
    mushGfx.fillStyle(0xc0c0c0, 1)
    mushGfx.fillRect(3, 6, 3, 4)
    mushGfx.fillStyle(0xe03020, 1)
    mushGfx.fillEllipse(4, 5, 9, 7)
    mushGfx.fillStyle(0xffffff, 1)
    mushGfx.fillCircle(3, 3, 1)
    mushGfx.fillCircle(6, 4, 1)
    mushGfx.fillCircle(4, 5, 1)
    ProceduralAssets.saveTexture(scene, mushGfx, 'mushroom', 8, 10)

    // --- Firefly glow ---
    for (let frame = 0; frame < 3; frame++) {
      const ffGfx = scene.add.graphics()
      const alpha = 0.4 + frame * 0.2
      ffGfx.fillStyle(0xffff80, alpha)
      ffGfx.fillEllipse(8, 8, 8, 8)
      ffGfx.fillStyle(0xffffff, alpha * 0.8)
      ffGfx.fillEllipse(8, 8, 4, 4)
      ProceduralAssets.saveTexture(scene, ffGfx, `firefly_${frame}`, 16, 16)
    }

    // --- Rain drop ---
    const rainGfx = scene.add.graphics()
    rainGfx.fillStyle(0x80b0ff, 0.7)
    rainGfx.fillRect(1, 0, 2, 6)
    rainGfx.fillEllipse(2, 6, 4, 3)
    ProceduralAssets.saveTexture(scene, rainGfx, 'raindrop', 4, 8)

    // --- Sparkle ---
    for (let i = 0; i < 4; i++) {
      const spkGfx = scene.add.graphics()
      spkGfx.fillStyle(0xffd700, 1)
      spkGfx.fillRect(4, 0, 2, 10)
      spkGfx.fillRect(0, 4, 10, 2)
      if (i > 1) {
        spkGfx.fillRect(2, 2, 2, 2)
        spkGfx.fillRect(6, 2, 2, 2)
        spkGfx.fillRect(2, 6, 2, 2)
        spkGfx.fillRect(6, 6, 2, 2)
      }
      ProceduralAssets.saveTexture(scene, spkGfx, `sparkle_${i}`, 10, 10)
    }

    // --- Cloud ---
    const cloudGfx = scene.add.graphics()
    cloudGfx.fillStyle(0xffffff, 0.88)
    cloudGfx.fillEllipse(20, 20, 24, 16)
    cloudGfx.fillEllipse(32, 16, 20, 14)
    cloudGfx.fillEllipse(12, 16, 18, 12)
    cloudGfx.fillRect(10, 18, 34, 10)
    ProceduralAssets.saveTexture(scene, cloudGfx, 'cloud', 44, 28)

    // --- Sun ---
    const sunGfx = scene.add.graphics()
    sunGfx.fillStyle(0xffdd00, 1)
    sunGfx.fillEllipse(16, 16, 20, 20)
    sunGfx.lineStyle(2, 0xffdd00, 0.8)
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8
      sunGfx.lineBetween(
        16 + Math.cos(angle) * 12, 16 + Math.sin(angle) * 12,
        16 + Math.cos(angle) * 18, 16 + Math.sin(angle) * 18
      )
    }
    ProceduralAssets.saveTexture(scene, sunGfx, 'sun', 32, 32)

    // --- Rainbow arc ---
    const rbGfx = scene.add.graphics()
    const rbColors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff]
    rbColors.forEach((c, i) => {
      rbGfx.lineStyle(3, c, 0.6)
      rbGfx.strokeCircle(64, 64, 50 + i * 4)
    })
    ProceduralAssets.saveTexture(scene, rbGfx, 'rainbow', 128, 128)

    // --- Interaction prompt 'E' ---
    const eGfx = scene.add.graphics()
    eGfx.fillStyle(0x000000, 0.6)
    eGfx.fillRoundedRect(0, 0, 20, 20, 4)
    eGfx.fillStyle(0xffffff, 1)
    eGfx.fillRect(5, 5, 10, 2)
    eGfx.fillRect(5, 9, 8, 2)
    eGfx.fillRect(5, 13, 10, 2)
    eGfx.fillRect(5, 5, 2, 10)
    ProceduralAssets.saveTexture(scene, eGfx, 'e_prompt', 20, 20)

    // --- Night overlay ---
    const nightGfx = scene.add.graphics()
    nightGfx.fillStyle(0x001030, 1)
    nightGfx.fillRect(0, 0, 32, 32)
    ProceduralAssets.saveTexture(scene, nightGfx, 'night_overlay', 32, 32)
  }

  static generateParticles(scene: Phaser.Scene): void {
    const dotGfx = scene.add.graphics()
    dotGfx.fillStyle(0xffffff, 1)
    dotGfx.fillCircle(4, 4, 4)
    ProceduralAssets.saveTexture(scene, dotGfx, 'particle_dot', 8, 8)

    const leafGfx = scene.add.graphics()
    leafGfx.fillStyle(0x60c040, 0.8)
    leafGfx.fillEllipse(4, 4, 8, 5)
    ProceduralAssets.saveTexture(scene, leafGfx, 'particle_leaf', 8, 8)
  }

  static generateUI(scene: Phaser.Scene): void {
    const bubbleGfx = scene.add.graphics()
    bubbleGfx.fillStyle(0xffffff, 0.95)
    bubbleGfx.fillRoundedRect(0, 0, 120, 40, 8)
    bubbleGfx.fillTriangle(20, 40, 30, 40, 25, 50)
    ProceduralAssets.saveTexture(scene, bubbleGfx, 'speech_bubble', 120, 50)
  }

  private static saveTexture(
    scene: Phaser.Scene,
    gfx: Phaser.GameObjects.Graphics,
    key: string,
    width: number,
    height: number
  ): void {
    if (scene.textures.exists(key)) {
      gfx.destroy()
      return
    }
    gfx.generateTexture(key, width, height)
    gfx.destroy()
  }
}
