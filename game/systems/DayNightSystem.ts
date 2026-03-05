import * as Phaser from 'phaser'
import { EventBridge } from '../EventBridge'

type Phase = 'day' | 'dusk' | 'night'

export class DayNightSystem {
  private scene: Phaser.Scene
  private phase: Phase = 'day'
  private tickInterval: number
  private elapsed = 0
  private fireflyEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []
  private hasFireflies = false

  // Configurable day length in ms (default 5 minutes)
  private readonly dayLength: number

  constructor(scene: Phaser.Scene, dayLengthMs = 5 * 60 * 1000) {
    this.scene = scene
    this.dayLength = dayLengthMs
    this.tickInterval = dayLengthMs / 4
  }

  update(delta: number): void {
    this.elapsed += delta
    const cycle = this.elapsed % this.dayLength
    const ratio = cycle / this.dayLength

    let newPhase: Phase
    if (ratio < 0.4) {
      newPhase = 'day'
    } else if (ratio < 0.55) {
      newPhase = 'dusk'
    } else {
      newPhase = 'night'
    }

    if (newPhase !== this.phase) {
      this.phase = newPhase
      EventBridge.emit('dayNightTick', { phase: newPhase })

      if (newPhase === 'night' && this.hasFireflies) {
        this.spawnFireflies()
      } else {
        this.clearFireflies()
      }
    }
  }

  setHasFireflies(value: boolean): void {
    this.hasFireflies = value
    if (value && this.phase === 'night') {
      this.spawnFireflies()
    }
  }

  private spawnFireflies(): void {
    if (!this.scene.textures.exists('firefly_0')) return
    this.clearFireflies()

    const { width, height } = this.scene.scale
    for (let i = 0; i < 8; i++) {
      const firefly = this.scene.add.image(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(50, height - 50),
        `firefly_${i % 3}`
      )
      firefly.setScrollFactor(0.3)
      firefly.setDepth(15)

      this.scene.tweens.add({
        targets: firefly,
        x: firefly.x + Phaser.Math.Between(-60, 60),
        y: firefly.y + Phaser.Math.Between(-40, 40),
        alpha: { from: 0.2, to: 0.9 },
        duration: 2000 + i * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  private clearFireflies(): void {
    this.fireflyEmitters.forEach((e) => e.destroy())
    this.fireflyEmitters = []
  }

  getPhase(): Phase {
    return this.phase
  }
}
