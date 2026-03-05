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

    // Grass tile
    const grassGfx = scene.add.graphics()
    grassGfx.fillStyle(0x7ec850, 1)
    grassGfx.fillRect(0, 0, tileSize, tileSize)
    // Add some variation
    const grassDots = [[2, 3, 0x6ab840], [5, 1, 0x8ed860], [9, 5, 0x6ab840], [13, 2, 0x8ed860], [7, 11, 0x6ab840], [11, 13, 0x8ed860], [3, 13, 0x6ab840]]
    grassDots.forEach(([x, y, c]) => ProceduralAssets.drawPixel(grassGfx, x as number, y as number, c as number, 2))
    ProceduralAssets.saveTexture(scene, grassGfx, 'tile_grass', tileSize, tileSize)

    // Dirt tile
    const dirtGfx = scene.add.graphics()
    dirtGfx.fillStyle(0xc4884a, 1)
    dirtGfx.fillRect(0, 0, tileSize, tileSize)
    const dirtDots = [[3, 4, 0xb07840], [8, 2, 0xd49858], [12, 8, 0xb07840], [5, 12, 0xd49858]]
    dirtDots.forEach(([x, y, c]) => ProceduralAssets.drawPixel(dirtGfx, x as number, y as number, c as number, 2))
    ProceduralAssets.saveTexture(scene, dirtGfx, 'tile_dirt', tileSize, tileSize)

    // Water tile
    const waterGfx = scene.add.graphics()
    waterGfx.fillStyle(0x4a9fd4, 1)
    waterGfx.fillRect(0, 0, tileSize, tileSize)
    waterGfx.fillStyle(0x5aafea, 1)
    waterGfx.fillRect(1, 1, 6, 2)
    waterGfx.fillRect(9, 6, 5, 2)
    waterGfx.fillRect(3, 11, 7, 2)
    ProceduralAssets.saveTexture(scene, waterGfx, 'tile_water', tileSize, tileSize)

    // Soil tile (for garden plots)
    const soilGfx = scene.add.graphics()
    soilGfx.fillStyle(0x8b5e3c, 1)
    soilGfx.fillRect(0, 0, tileSize, tileSize)
    soilGfx.fillStyle(0x7a5030, 1)
    soilGfx.fillRect(0, 0, tileSize, 2)
    soilGfx.fillRect(0, 4, tileSize, 2)
    soilGfx.fillRect(0, 8, tileSize, 2)
    soilGfx.fillRect(0, 12, tileSize, 2)
    ProceduralAssets.saveTexture(scene, soilGfx, 'tile_soil', tileSize, tileSize)

    // Path tile (beige)
    const pathGfx = scene.add.graphics()
    pathGfx.fillStyle(0xd4b483, 1)
    pathGfx.fillRect(0, 0, tileSize, tileSize)
    pathGfx.fillStyle(0xc4a470, 1)
    pathGfx.fillRect(2, 2, 3, 3)
    pathGfx.fillRect(9, 6, 4, 4)
    pathGfx.fillRect(5, 11, 3, 3)
    ProceduralAssets.saveTexture(scene, pathGfx, 'tile_path', tileSize, tileSize)

    // Water edge tiles
    const edges = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
    edges.forEach((dir) => {
      const edgeGfx = scene.add.graphics()
      edgeGfx.fillStyle(0x4a9fd4, 1)
      edgeGfx.fillRect(0, 0, tileSize, tileSize)
      edgeGfx.fillStyle(0x7ec850, 1)
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
      farmer_girl: 0xff8090,
      farmer_boy: 0x6090d0,
      cow: 0xffffff,
    }
    const dirs = ['down', 'up', 'left', 'right']

    avatars.forEach((avatar) => {
      const bodyColor = bodyColors[avatar]
      dirs.forEach((dir) => {
        for (let frame = 0; frame < 3; frame++) {
          const gfx = scene.add.graphics()
          const offset = (frame - 1) * 2

          // Shadow
          gfx.fillStyle(0x000000, 0.2)
          gfx.fillEllipse(8, 15, 10, 4)

          // Body
          gfx.fillStyle(bodyColor, 1)
          gfx.fillRect(4, 6, 8, 8)

          // Head
          if (avatar === 'cow') {
            gfx.fillStyle(0xffffff, 1)
            gfx.fillRect(3, 1, 10, 8)
            // Cow spots
            gfx.fillStyle(0x333333, 1)
            gfx.fillRect(5, 2, 3, 3)
            gfx.fillRect(9, 4, 2, 2)
          } else {
            gfx.fillStyle(0xffd5a0, 1)
            gfx.fillRect(4, 1, 8, 7)
          }

          // Hat for farmer
          if (avatar !== 'cow') {
            gfx.fillStyle(avatar === 'farmer_girl' ? 0xff6080 : 0x4060b0, 1)
            gfx.fillRect(3, 0, 10, 3)
            gfx.fillRect(2, 2, 12, 2)
          }

          // Legs with walk cycle
          gfx.fillStyle(avatar === 'farmer_girl' ? 0x8040a0 : 0x3050a0, 1)
          const legOffset1 = frame === 0 ? -2 : frame === 2 ? 2 : 0
          const legOffset2 = frame === 0 ? 2 : frame === 2 ? -2 : 0
          gfx.fillRect(4, 13, 3, 3 + legOffset1)
          gfx.fillRect(9, 13, 3, 3 + legOffset2)

          // Direction indicator (eyes/facing)
          gfx.fillStyle(0x333333, 1)
          if (dir === 'down') {
            gfx.fillRect(5, 4, 2, 2)
            gfx.fillRect(9, 4, 2, 2)
          } else if (dir === 'up') {
            // back of head visible
          } else if (dir === 'left') {
            gfx.fillRect(4, 4, 2, 2)
          } else {
            gfx.fillRect(10, 4, 2, 2)
          }

          ProceduralAssets.saveTexture(scene, gfx, `${avatar}_${dir}_${frame}`, 16, 16)
        }
      })
    })
  }

  static generateNPCs(scene: Phaser.Scene): void {
    const npcs = [
      { key: 'npc_guide', bodyColor: 0xa0d0ff, hatColor: 0x6090d0 },
      { key: 'npc_gardener', bodyColor: 0xa0ffa0, hatColor: 0x408040 },
      { key: 'npc_neighbor', bodyColor: 0xffd0a0, hatColor: 0xd09060 },
    ]

    npcs.forEach(({ key, bodyColor, hatColor }) => {
      for (let frame = 0; frame < 2; frame++) {
        const gfx = scene.add.graphics()

        // Shadow
        gfx.fillStyle(0x000000, 0.15)
        gfx.fillEllipse(8, 15, 10, 3)

        // Body
        gfx.fillStyle(bodyColor, 1)
        gfx.fillRect(4, 6, 8, 8)

        // Head
        gfx.fillStyle(0xffd5a0, 1)
        gfx.fillRect(4, 1, 8, 7)

        // Hat
        gfx.fillStyle(hatColor, 1)
        gfx.fillRect(3, 0, 10, 3)

        // Eyes
        gfx.fillStyle(0x333333, 1)
        gfx.fillRect(5, 4, 2, 2)
        gfx.fillRect(9, 4, 2, 2)

        // Idle bob
        if (frame === 1) {
          gfx.fillStyle(0xffd5a0, 0.3)
          gfx.fillRect(4, 0, 8, 1)
        }

        ProceduralAssets.saveTexture(scene, gfx, `${key}_${frame}`, 16, 16)
      }
    })
  }

  static generateDecorations(scene: Phaser.Scene): void {
    // Tree
    for (let frame = 0; frame < 2; frame++) {
      const gfx = scene.add.graphics()
      const sway = frame === 0 ? 0 : 1

      // Trunk
      gfx.fillStyle(0x8b5e3c, 1)
      gfx.fillRect(7, 18, 6, 10)

      // Leaves
      gfx.fillStyle(0x4a9030, 1)
      gfx.fillEllipse(10 + sway, 14, 18, 16)
      gfx.fillStyle(0x5aaa40, 1)
      gfx.fillEllipse(10 + sway, 10, 14, 12)
      gfx.fillStyle(0x6ac050, 1)
      gfx.fillEllipse(10, 7, 10, 9)

      ProceduralAssets.saveTexture(scene, gfx, `tree_${frame}`, 20, 28)
    }

    // House (Journal House)
    const houseGfx = scene.add.graphics()
    // Walls
    houseGfx.fillStyle(0xf5e6d0, 1)
    houseGfx.fillRect(0, 16, 48, 32)
    // Roof
    houseGfx.fillStyle(0xd06040, 1)
    houseGfx.fillTriangle(24, 0, 0, 18, 48, 18)
    // Door
    houseGfx.fillStyle(0x8b5e3c, 1)
    houseGfx.fillRect(18, 32, 12, 16)
    // Door knob
    houseGfx.fillStyle(0xffd700, 1)
    houseGfx.fillRect(26, 40, 2, 2)
    // Windows
    houseGfx.fillStyle(0x90d4ff, 1)
    houseGfx.fillRect(4, 22, 10, 8)
    houseGfx.fillRect(34, 22, 10, 8)
    // Window frames
    houseGfx.fillStyle(0x8b5e3c, 1)
    houseGfx.fillRect(8, 22, 2, 8)
    houseGfx.fillRect(4, 26, 10, 2)
    houseGfx.fillRect(38, 22, 2, 8)
    houseGfx.fillRect(34, 26, 10, 2)
    // Sign
    houseGfx.fillStyle(0xd4a870, 1)
    houseGfx.fillRect(12, 16, 24, 8)
    ProceduralAssets.saveTexture(scene, houseGfx, 'house', 48, 48)

    // Pond
    const pondGfx = scene.add.graphics()
    pondGfx.fillStyle(0x5ab4e8, 1)
    pondGfx.fillEllipse(32, 20, 64, 40)
    pondGfx.fillStyle(0x7aceff, 1)
    pondGfx.fillEllipse(26, 16, 20, 10)
    pondGfx.fillEllipse(42, 22, 12, 6)
    ProceduralAssets.saveTexture(scene, pondGfx, 'pond', 64, 40)

    // Fence
    const fenceGfx = scene.add.graphics()
    fenceGfx.fillStyle(0xd4b483, 1)
    fenceGfx.fillRect(0, 2, 4, 14)
    fenceGfx.fillRect(12, 2, 4, 14)
    fenceGfx.fillRect(0, 4, 16, 3)
    fenceGfx.fillRect(0, 10, 16, 3)
    fenceGfx.fillTriangle(2, 2, 4, 0, 6, 2)
    fenceGfx.fillTriangle(14, 2, 16, 0, 18, 2)
    ProceduralAssets.saveTexture(scene, fenceGfx, 'fence', 16, 16)

    // Lantern
    const lanternGfx = scene.add.graphics()
    lanternGfx.fillStyle(0xffd700, 1)
    lanternGfx.fillRect(6, 0, 4, 4)
    lanternGfx.fillStyle(0x888888, 1)
    lanternGfx.fillRect(4, 4, 8, 12)
    lanternGfx.fillStyle(0xffe080, 0.8)
    lanternGfx.fillRect(5, 5, 6, 10)
    lanternGfx.fillStyle(0x888888, 1)
    lanternGfx.fillRect(3, 15, 10, 2)
    ProceduralAssets.saveTexture(scene, lanternGfx, 'lantern', 16, 17)

    // Butterfly (2-frame)
    for (let frame = 0; frame < 2; frame++) {
      const bGfx = scene.add.graphics()
      const spread = frame === 0 ? 1 : 0.6
      bGfx.fillStyle(0xff80c0, 0.9)
      bGfx.fillEllipse(4 * spread, 4, 8 * spread, 6)
      bGfx.fillEllipse(12 + (1 - spread) * 4, 5, 7 * spread, 5)
      bGfx.fillStyle(0xff40a0, 1)
      bGfx.fillEllipse(4 * spread, 7, 5 * spread, 4)
      bGfx.fillEllipse(12 + (1 - spread) * 4, 8, 4 * spread, 4)
      bGfx.fillStyle(0x333333, 1)
      bGfx.fillRect(7, 2, 2, 10)
      ProceduralAssets.saveTexture(scene, bGfx, `butterfly_${frame}`, 16, 12)
    }

    // Bunny idle
    for (let frame = 0; frame < 2; frame++) {
      const bunGfx = scene.add.graphics()
      bunGfx.fillStyle(0xf0f0f0, 1)
      bunGfx.fillEllipse(8, 10, 12, 10)
      bunGfx.fillEllipse(8, 6, 8, 8)
      bunGfx.fillStyle(0xffc0c0, 1)
      bunGfx.fillRect(5, frame === 0 ? 1 : 2, 2, 5)
      bunGfx.fillRect(9, frame === 0 ? 0 : 1, 2, 5)
      bunGfx.fillStyle(0x333333, 1)
      bunGfx.fillRect(6, 5, 1, 1)
      bunGfx.fillRect(9, 5, 1, 1)
      ProceduralAssets.saveTexture(scene, bunGfx, `bunny_${frame}`, 16, 16)
    }

    // Firefly glow
    for (let frame = 0; frame < 3; frame++) {
      const ffGfx = scene.add.graphics()
      const alpha = 0.4 + frame * 0.2
      ffGfx.fillStyle(0xffff80, alpha)
      ffGfx.fillEllipse(8, 8, 8, 8)
      ffGfx.fillStyle(0xffffff, alpha * 0.8)
      ffGfx.fillEllipse(8, 8, 4, 4)
      ProceduralAssets.saveTexture(scene, ffGfx, `firefly_${frame}`, 16, 16)
    }

    // Rain drop
    const rainGfx = scene.add.graphics()
    rainGfx.fillStyle(0x80b0ff, 0.7)
    rainGfx.fillRect(1, 0, 2, 6)
    rainGfx.fillEllipse(2, 6, 4, 3)
    ProceduralAssets.saveTexture(scene, rainGfx, 'raindrop', 4, 8)

    // Sparkle
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

    // Cloud
    const cloudGfx = scene.add.graphics()
    cloudGfx.fillStyle(0xffffff, 0.85)
    cloudGfx.fillEllipse(20, 20, 24, 16)
    cloudGfx.fillEllipse(32, 16, 20, 14)
    cloudGfx.fillEllipse(12, 16, 18, 12)
    cloudGfx.fillRect(10, 18, 34, 10)
    ProceduralAssets.saveTexture(scene, cloudGfx, 'cloud', 44, 28)

    // Sun rays
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

    // Rainbow arc
    const rbGfx = scene.add.graphics()
    const rbColors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff]
    rbColors.forEach((c, i) => {
      rbGfx.lineStyle(3, c, 0.6)
      rbGfx.strokeCircle(64, 64, 50 + i * 4)
    })
    ProceduralAssets.saveTexture(scene, rbGfx, 'rainbow', 128, 128)

    // Interaction prompt 'E'
    const eGfx = scene.add.graphics()
    eGfx.fillStyle(0x000000, 0.6)
    eGfx.fillRoundedRect(0, 0, 20, 20, 4)
    eGfx.fillStyle(0xffffff, 1)
    eGfx.fillRect(5, 5, 10, 2)
    eGfx.fillRect(5, 9, 8, 2)
    eGfx.fillRect(5, 13, 10, 2)
    eGfx.fillRect(5, 5, 2, 10)
    ProceduralAssets.saveTexture(scene, eGfx, 'e_prompt', 20, 20)

    // Night overlay gradient texture
    const nightGfx = scene.add.graphics()
    nightGfx.fillStyle(0x001030, 1)
    nightGfx.fillRect(0, 0, 32, 32)
    ProceduralAssets.saveTexture(scene, nightGfx, 'night_overlay', 32, 32)
  }

  static generateParticles(scene: Phaser.Scene): void {
    // Particle dot
    const dotGfx = scene.add.graphics()
    dotGfx.fillStyle(0xffffff, 1)
    dotGfx.fillCircle(4, 4, 4)
    ProceduralAssets.saveTexture(scene, dotGfx, 'particle_dot', 8, 8)

    // Leaf particle
    const leafGfx = scene.add.graphics()
    leafGfx.fillStyle(0x60c040, 0.8)
    leafGfx.fillEllipse(4, 4, 8, 5)
    ProceduralAssets.saveTexture(scene, leafGfx, 'particle_leaf', 8, 8)
  }

  static generateUI(scene: Phaser.Scene): void {
    // Speech bubble
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
