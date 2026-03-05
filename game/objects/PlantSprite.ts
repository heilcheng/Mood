import * as Phaser from 'phaser'
import type { Plant } from '@/lib/types'
import { PLANT_TO_CROP } from '../utils/CozyValleyLoader'

export class PlantSprite extends Phaser.GameObjects.Sprite {
  readonly plantData: Plant
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null

  constructor(scene: Phaser.Scene, plant: Plant, pixelX: number, pixelY: number) {
    const { key, frames } = PlantSprite.resolve(plant)
    super(scene, pixelX, pixelY, key, frames[plant.stage] ?? frames[0])
    this.plantData = plant

    scene.add.existing(this)
    this.setDepth(4)
    this.setOrigin(0.5, 1)

    scene.tweens.add({
      targets: this,
      y: pixelY - 2,
      duration: 2000 + Math.random() * 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  }

  private static resolve(plant: Plant): { key: string; frames: number[] } {
    return PLANT_TO_CROP[plant.plant_type] ?? { key: 'crop_carrot', frames: [0, 2, 5, 9] }
  }

  advanceStage(): void {
    const newStage = Math.min(this.plantData.stage + 1, 3)
    ;(this.plantData as { stage: number }).stage = newStage
    const { key, frames } = PlantSprite.resolve(this.plantData)
    this.setTexture(key, frames[newStage] ?? frames[frames.length - 1])
    this.playSparkle()
  }

  playSparkle(): void {
    if (!this.scene.textures.exists('sparkle_0')) return
    const scene = this.scene
    for (let i = 0; i < 6; i++) {
      const sparkle = scene.add.image(
        this.x + Phaser.Math.Between(-8, 8),
        this.y + Phaser.Math.Between(-16, 0),
        `sparkle_${i % 4}`
      )
      sparkle.setDepth(10)
      sparkle.setScale(0.5)
      scene.tweens.add({
        targets: sparkle,
        y: sparkle.y - 20, alpha: 0, scale: 1.5,
        duration: 600 + i * 80, ease: 'Power2',
        onComplete: () => sparkle.destroy(),
      })
    }
  }

  destroy(fromScene?: boolean): void {
    this.particles?.destroy()
    super.destroy(fromScene)
  }
}
