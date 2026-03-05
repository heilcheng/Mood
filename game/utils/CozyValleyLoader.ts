import type Phaser from 'phaser'

// Terrain.png: 256×160 = 16 cols × 10 rows at 16px
// Frame index = row * 16 + col
// All indices MUST be verified via /debug atlas page before use.
// Source of truth: /game/phaser/tiles/tileCatalog.ts
import { GRASS_FILL, DIRT_FILL, PATH_FILL, GRASS_LIGHT, GRASS_DARK } from '../phaser/tiles/tileCatalog'

export const TERRAIN = {
  GRASS: GRASS_FILL,
  GRASS_LIGHT,
  GRASS_DARK,
  DIRT: DIRT_FILL,
  PATH: PATH_FILL,
}

// Water.png: 64×80 = 4 cols × 5 rows at 16px
export const WATER = {
  CENTER: 0,
  EDGE_N: 1,
  EDGE_S: 2,
  EDGE_E: 3,
  EDGE_W: 4,
}

// Soil.png: 128×48 = 8 cols × 3 rows at 16px
export const SOIL = {
  PLAIN: 0,
}

// Woodenfence.png: 112×48 = 7 cols × 3 rows at 16px
export const FENCE = {
  CORNER_TL: 0,
  H_TOP: 1,
  CORNER_TR: 2,
  V_LEFT: 7,
  V_RIGHT: 9,
  CORNER_BL: 14,
  H_BOTTOM: 15,
  CORNER_BR: 16,
}

// Character spritesheets: 160×576 = 5 cols × 18 rows at 32×32
// col 0 = bare hands. Frame = row * 5 + col.
export const CHAR = {
  WALK_DOWN: [0, 5, 10],
  WALK_UP: [15, 20, 25],
  WALK_LEFT: [30, 35, 40],
  WALK_RIGHT: [45, 50, 55],
  IDLE: [60],
}

// Cow: 128×160 = 4 cols × 5 rows at 32×32
export const COW_ANIM = {
  WALK_DOWN: [0, 1, 2, 3],
  WALK_LEFT: [4, 5, 6, 7],
  WALK_RIGHT: [8, 9, 10, 11],
  WALK_UP: [12, 13, 14, 15],
  IDLE: [16],
}

// Chicken: 32×80 = 2 cols × 5 rows at 16×16
export const CHICKEN_ANIM = {
  WALK_DOWN: [0, 1],
  WALK_UP: [2, 3],
  WALK_LEFT: [4, 5],
  WALK_RIGHT: [6, 7],
  IDLE: [8],
}

// Sheep: 128×128 = 4 cols × 4 rows at 32×32
export const SHEEP_ANIM = {
  WALK_DOWN: [0, 1, 2, 3],
  WALK_UP: [4, 5, 6, 7],
  WALK_LEFT: [8, 9, 10, 11],
  WALK_RIGHT: [12, 13, 14, 15],
}

// Duck/Goose: 32×80 = 2 cols × 5 rows at 16×16 (same layout as Chicken)
export const DUCK_ANIM = {
  WALK_DOWN: [0, 1],
  WALK_UP: [2, 3],
  WALK_LEFT: [4, 5],
  WALK_RIGHT: [6, 7],
  IDLE: [8],
}

export const GOOSE_ANIM = {
  WALK_DOWN: [0, 1],
  WALK_UP: [2, 3],
  WALK_LEFT: [4, 5],
  WALK_RIGHT: [6, 7],
  IDLE: [8],
}

// Plant-type → crop spritesheet key + stage→frame mapping
// Crop spritesheets are 80×32 (5 cols × 2 rows) or 80×48 (5 cols × 3 rows) at 16×16
// We map 4 growth stages (0-3) to frame indices
export const PLANT_TO_CROP: Record<string, { key: string; frames: number[] }> = {
  sunflower: { key: 'crop_sunflower', frames: [0, 5, 10, 14] },
  daisy: { key: 'crop_carrot', frames: [0, 2, 5, 9] },
  lotus: { key: 'crop_pumpkin', frames: [0, 2, 5, 9] },
  lavender: { key: 'crop_potato', frames: [0, 2, 5, 9] },
  oak_sapling: { key: 'crop_parsnip', frames: [0, 2, 5, 9] },
}

const CHAR_FRAME_W = 32
const CHAR_FRAME_H = 32

export class CozyValleyLoader {
  static preloadAll(scene: Phaser.Scene): void {
    // Background music
    scene.load.audio('farm_theme', '/assets/music/farm_theme.mp3')

    // Ground tiles
    scene.load.spritesheet('terrain', '/assets/CozyValley/Tilesets/Terrain.png', { frameWidth: 16, frameHeight: 16 })
    scene.load.spritesheet('water_ss', '/assets/CozyValley/Tilesets/Water.png', { frameWidth: 16, frameHeight: 16 })
    scene.load.spritesheet('soil_ss', '/assets/CozyValley/Tilesets/Soil.png', { frameWidth: 16, frameHeight: 16 })
    scene.load.spritesheet('fence_ss', '/assets/CozyValley/Tilesets/Woodenfence.png', { frameWidth: 16, frameHeight: 16 })
    scene.load.spritesheet('flowers_ss', '/assets/CozyValley/Tilesets/Flowers.png', { frameWidth: 16, frameHeight: 16 })
    scene.load.spritesheet('farmprops_ss', '/assets/CozyValley/Tilesets/Farmprops.png', { frameWidth: 16, frameHeight: 16 })
    scene.load.spritesheet('boats_ss', '/assets/CozyValley/Tilesets/Boats.png', { frameWidth: 48, frameHeight: 32 })

    // Structures (single images)
    scene.load.image('barn', '/assets/CozyValley/Tilesets/Barn.png')
    scene.load.image('tree_oak', '/assets/CozyValley/Tilesets/Trees/Trees_oak.png')
    scene.load.image('tree_cherry', '/assets/CozyValley/Tilesets/Trees/Trees_cherryblossom.png')
    scene.load.image('tree_spruce', '/assets/CozyValley/Tilesets/Trees/Trees_spruce.png')

      // Crops (each 80×32 or 80×48 at 16×16)
      ;['sunflower', 'carrot', 'potato', 'pumpkin', 'parsnip'].forEach((t) => {
        scene.load.spritesheet(`crop_${t}`, `/assets/CozyValley/Tilesets/Crops/Crops_${t}.png`, { frameWidth: 16, frameHeight: 16 })
      })

    // Character layers & Full assembled characters (160×576 = 5 cols × 18 rows, 32×32 per frame)
    const charParts = [
      { key: 'base1_body', path: 'Characters/Base/Base1_body.png' },
      { key: 'base1_hand_front', path: 'Characters/Base/Base1_hand_front.png' },
      { key: 'base1_hand_back', path: 'Characters/Base/Base1_hand_back.png' },
      { key: 'base2_body', path: 'Characters/Base/Base2_body.png' },
      { key: 'base2_hand_front', path: 'Characters/Base/Base2_hand_front.png' },
      { key: 'base2_hand_back', path: 'Characters/Base/Base2_hand_back.png' },
      { key: 'hair1', path: 'Characters/Hairstyles/Hairstyles_short_1.png' },
      { key: 'hair3', path: 'Characters/Hairstyles/Hairstyles_short_3.png' },
      { key: 'shirt1', path: 'Characters/Tops/Tops_shirt_1.png' },
      { key: 'shirt3', path: 'Characters/Tops/Tops_shirt_3.png' },
      { key: 'shorts1', path: 'Characters/Bottoms/Bottoms_shorts_1.png' },
      { key: 'shorts2', path: 'Characters/Bottoms/Bottoms_shorts_2.png' },
      // Full pre-assembled characters (player + NPCs)
      { key: 'char1', path: 'Characters/-- Pre-assembled Characters/char1.png' },
      { key: 'char2', path: 'Characters/-- Pre-assembled Characters/char2.png' },
      { key: 'char3', path: 'Characters/-- Pre-assembled Characters/char3.png' },
      { key: 'char4', path: 'Characters/-- Pre-assembled Characters/char4.png' },
      { key: 'char5', path: 'Characters/-- Pre-assembled Characters/char5.png' },
    ]
    charParts.forEach(({ key, path }) =>
      scene.load.spritesheet(key, `/assets/CozyValley/${path}`, { frameWidth: CHAR_FRAME_W, frameHeight: CHAR_FRAME_H })
    )

    // Animals
    scene.load.spritesheet('cow_ss', '/assets/CozyValley/Animals/Cow/Cow_brownwhite.png', { frameWidth: 32, frameHeight: 32 })
    scene.load.spritesheet('cow_bw_ss', '/assets/CozyValley/Animals/Cow/Cow_blackwhite.png', { frameWidth: 32, frameHeight: 32 })
    scene.load.spritesheet('chicken_ss', '/assets/CozyValley/Animals/Chicken/Chicken_white.png', { frameWidth: 16, frameHeight: 16 })
    scene.load.spritesheet('sheep_ss', '/assets/CozyValley/Animals/Sheep/Sheep_white.png', { frameWidth: 32, frameHeight: 32 })
    scene.load.spritesheet('duck_mallard', '/assets/CozyValley/Animals/Duck/Duck_mallard.png', { frameWidth: 16, frameHeight: 16 })
    scene.load.spritesheet('duck_white', '/assets/CozyValley/Animals/Duck/Duck_white.png', { frameWidth: 16, frameHeight: 16 })
    scene.load.spritesheet('goose_white', '/assets/CozyValley/Animals/Goose/Goose_white.png', { frameWidth: 16, frameHeight: 16 })
  }

  static createAnims(scene: Phaser.Scene): void {
    // All character layer keys + pre-assembled NPC chars share the same frame layout
    // (160×576, 10 cols × 18 rows, 16×32 per frame; col 0 = bare-hands, frame = row*10+col)
    const charLayerKeys = [
      'base1_body', 'base1_hand_front', 'base1_hand_back',
      'base2_body', 'base2_hand_front', 'base2_hand_back',
      'hair1', 'hair3', 'shirt1', 'shirt3', 'shorts1', 'shorts2',
      // Pre-assembled characters (player + NPCs)
      'char1', 'char2', 'char3', 'char4', 'char5',
    ]

    const charDirs: Array<[string, number[], number]> = [
      ['walk_down', CHAR.WALK_DOWN, 8],
      ['walk_up', CHAR.WALK_UP, 8],
      ['walk_left', CHAR.WALK_LEFT, 8],
      ['walk_right', CHAR.WALK_RIGHT, 8],
      ['idle', CHAR.IDLE, 1],
    ]

    charLayerKeys.forEach((key) => {
      charDirs.forEach(([dir, frames, fps]) => {
        const animKey = `${key}_${dir}`
        if (!scene.anims.exists(animKey)) {
          scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNumbers(key, { frames }),
            frameRate: fps,
            repeat: -1,
          })
        }
      })
    })

    // Cow (brownwhite NPC cows + blackwhite player cow)
    const cowDirs: Array<[string, number[]]> = [
      ['walk_down', COW_ANIM.WALK_DOWN],
      ['walk_up', COW_ANIM.WALK_UP],
      ['walk_left', COW_ANIM.WALK_LEFT],
      ['walk_right', COW_ANIM.WALK_RIGHT],
      ['idle', COW_ANIM.IDLE],
    ]
      ;['cow_ss', 'cow_bw_ss'].forEach((cowKey) => {
        cowDirs.forEach(([dir, frames]) => {
          const key = `${cowKey}_${dir}`
          if (!scene.anims.exists(key)) {
            scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(cowKey, { frames }), frameRate: dir === 'idle' ? 2 : 8, repeat: -1 })
          }
        })
      })

    // Chicken
    const chickenDirs: Array<[string, number[]]> = [
      ['walk_down', CHICKEN_ANIM.WALK_DOWN],
      ['walk_up', CHICKEN_ANIM.WALK_UP],
      ['walk_left', CHICKEN_ANIM.WALK_LEFT],
      ['walk_right', CHICKEN_ANIM.WALK_RIGHT],
      ['idle', CHICKEN_ANIM.IDLE],
    ]
    chickenDirs.forEach(([dir, frames]) => {
      const key = `chicken_ss_${dir}`
      if (!scene.anims.exists(key)) {
        scene.anims.create({ key, frames: scene.anims.generateFrameNumbers('chicken_ss', { frames }), frameRate: dir === 'idle' ? 2 : 6, repeat: -1 })
      }
    })

    // Sheep
    const sheepDirs: Array<[string, number[]]> = [
      ['walk_down', SHEEP_ANIM.WALK_DOWN],
      ['walk_up', SHEEP_ANIM.WALK_UP],
      ['walk_left', SHEEP_ANIM.WALK_LEFT],
      ['walk_right', SHEEP_ANIM.WALK_RIGHT],
    ]
    sheepDirs.forEach(([dir, frames]) => {
      const key = `sheep_ss_${dir}`
      if (!scene.anims.exists(key)) {
        scene.anims.create({ key, frames: scene.anims.generateFrameNumbers('sheep_ss', { frames }), frameRate: 4, repeat: -1 })
      }
    })

    // Ducks and Goose (same frame layout as Chicken: 2 cols × 5 rows at 16×16)
    const birdSprites = ['duck_mallard', 'duck_white', 'goose_white']
    const birdDirs: Array<[string, number[]]> = [
      ['walk_down', DUCK_ANIM.WALK_DOWN],
      ['walk_up', DUCK_ANIM.WALK_UP],
      ['walk_left', DUCK_ANIM.WALK_LEFT],
      ['walk_right', DUCK_ANIM.WALK_RIGHT],
      ['idle', DUCK_ANIM.IDLE],
    ]
    birdSprites.forEach((bkey) => {
      birdDirs.forEach(([dir, frames]) => {
        const key = `${bkey}_${dir}`
        if (!scene.anims.exists(key)) {
          scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(bkey, { frames }), frameRate: dir === 'idle' ? 2 : 6, repeat: -1 })
        }
      })
    })
  }
}
