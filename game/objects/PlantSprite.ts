import * as Phaser from 'phaser'
import type { Plant } from '@/lib/types'

export class PlantSprite extends Phaser.GameObjects.Sprite {
  readonly plantData: Plant
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null

  constructor(scene: Phaser.Scene, plant: Plant, pixelX: number, pixelY: number) {
    const textureKey = `${plant.plant_type}_${plant.stage}`
    super(scene, pixelX, pixelY, textureKey)
    this.plantData = plant

    scene.add.existing(this)
    this.setDepth(4)
    this.setOrigin(0.5, 1)

    // Gentle float tween
    scene.tweens.add({
      targets: this,
      y: pixelY - 2,
      duration: 2000 + Math.random() * 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  }

  advanceStage(): void {
    const newStage = Math.min(this.plantData.stage + 1, 3)
    ;(this.plantData as { stage: number }).stage = newStage
    this.setTexture(`${this.plantData.plant_type}_${newStage}`)
    this.playSparkle()
  }

  playSparkle(): void {
    if (!this.scene.textures.exists('sparkle_0')) return

    // Create a simple sparkle effect
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
        y: sparkle.y - 20,
        alpha: 0,
        scale: 1.5,
        duration: 600 + i * 80,
        ease: 'Power2',
        onComplete: () => sparkle.destroy(),
      })
    }
  }

  destroy(fromScene?: boolean): void {
    this.particles?.destroy()
    super.destroy(fromScene)
  }
}
