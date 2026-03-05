import * as Phaser from 'phaser'
import type { WeatherState, Mood } from '@/lib/types'

export class WeatherSystem {
  private scene: Phaser.Scene
  private overlay: Phaser.GameObjects.Rectangle | null = null
  private clouds: Phaser.GameObjects.Image[] = []
  private sunRays: Phaser.GameObjects.Image | null = null
  private rainbow: Phaser.GameObjects.Image | null = null
  private rainEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null
  private currentWeather: WeatherState = 'sunshine'

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createOverlay()
    this.applySunshine()
  }

  private createOverlay(): void {
    const { width, height } = this.scene.scale
    this.overlay = this.scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x000000, 0
    )
    this.overlay.setScrollFactor(0)
    this.overlay.setDepth(20)
  }

  updateWeather(moodWindow: Mood[]): WeatherState {
    const counts: Record<string, number> = {}
    moodWindow.forEach((m) => { counts[m] = (counts[m] || 0) + 1 })

    let newWeather: WeatherState = 'sunshine'
    if ((counts['stressed'] || 0) > moodWindow.length / 2) {
      newWeather = 'cloudy'
    } else if ((counts['happy'] || 0) + (counts['gratitude'] || 0) >= 2) {
      newWeather = 'rainbow'
    } else {
      newWeather = 'sunshine'
    }

    this.setWeather(newWeather)
    return newWeather
  }

  setWeather(weather: WeatherState): void {
    if (this.currentWeather === weather) return
    this.currentWeather = weather
    this.clearEffects()

    switch (weather) {
      case 'sunshine': this.applySunshine(); break
      case 'cloudy': this.applyCloudy(); break
      case 'rainbow': this.applyRainbow(); break
      case 'night': this.applyNight(); break
    }
  }

  private clearEffects(): void {
    this.clouds.forEach((c) => c.destroy())
    this.clouds = []
    this.sunRays?.destroy()
    this.sunRays = null
    this.rainbow?.destroy()
    this.rainbow = null
    this.rainEmitter?.destroy()
    this.rainEmitter = null
    this.overlay?.setFillStyle(0x000000, 0)
  }

  private applySunshine(): void {
    if (!this.scene.textures.exists('sun')) return
    const { width } = this.scene.scale
    this.sunRays = this.scene.add.image(width - 40, 40, 'sun')
    this.sunRays.setScrollFactor(0)
    this.sunRays.setDepth(1)
    this.sunRays.setAlpha(0.8)

    this.scene.tweens.add({
      targets: this.sunRays,
      angle: 360,
      duration: 20000,
      repeat: -1,
    })
  }

  private applyCloudy(): void {
    if (!this.scene.textures.exists('cloud')) return
    const { width } = this.scene.scale
    for (let i = 0; i < 4; i++) {
      const cloud = this.scene.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(10, 60),
        'cloud'
      )
      cloud.setScrollFactor(0)
      cloud.setDepth(2)
      cloud.setAlpha(0.8)
      this.clouds.push(cloud)

      this.scene.tweens.add({
        targets: cloud,
        x: cloud.x + (i % 2 === 0 ? 100 : -100),
        duration: 8000 + i * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    // Grey overlay
    this.overlay?.setFillStyle(0x808080, 0.1)
  }

  private applyRainbow(): void {
    if (!this.scene.textures.exists('rainbow')) return
    const { width } = this.scene.scale
    this.rainbow = this.scene.add.image(width / 2, 40, 'rainbow')
    this.rainbow.setScrollFactor(0)
    this.rainbow.setDepth(2)
    this.rainbow.setAlpha(0)
    this.rainbow.setScale(2)

    this.scene.tweens.add({
      targets: this.rainbow,
      alpha: 0.6,
      duration: 2000,
      ease: 'Power2',
    })

    this.applySunshine()
  }

  private applyNight(): void {
    this.overlay?.setFillStyle(0x001030, 0.45)
  }

  applyDayNightPhase(phase: 'day' | 'dusk' | 'night'): void {
    const colors = {
      day: { color: 0x000000, alpha: 0 },
      dusk: { color: 0xff8040, alpha: 0.15 },
      night: { color: 0x001030, alpha: 0.45 },
    }
    const target = colors[phase]
    this.overlay?.setFillStyle(target.color, target.alpha)
  }

  getCurrentWeather(): WeatherState {
    return this.currentWeather
  }
}
