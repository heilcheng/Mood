import * as Phaser from 'phaser'

export interface NPCConfig {
  id: string
  x: number
  y: number
  textureKey: string
  message: string
  patrolRadius?: number
}

export class NPC extends Phaser.Physics.Arcade.Sprite {
  readonly npcId: string
  readonly message: string
  private patrolTarget: { x: number; y: number } | null = null
  private readonly npcOriginX: number
  private readonly npcOriginY: number
  private readonly patrolRadius: number
  private patrolTimer = 0
  private currentDir: 'down' | 'up' | 'left' | 'right' = 'down'

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    super(scene, config.x, config.y, config.textureKey, 0)
    this.npcId = config.id
    this.message = config.message
    this.npcOriginX = config.x
    this.npcOriginY = config.y
    this.patrolRadius = config.patrolRadius ?? 20

    scene.add.existing(this)
    scene.physics.add.existing(this, true)

    this.setDepth(5)
    this.setOrigin(0.5, 1)
    // Start front-facing (walk_down frame 0 = facing camera)
    this.setFrame(0)
  }

  update(delta: number): void {
    if (!this.active || !this.scene) return

    // Simple patrol behavior
    this.patrolTimer += delta
    if (this.patrolTimer > 3000 + Math.random() * 2000) {
      this.patrolTimer = 0
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * this.patrolRadius
      this.patrolTarget = {
        x: Phaser.Math.Clamp(this.npcOriginX + Math.cos(angle) * dist, this.npcOriginX - this.patrolRadius, this.npcOriginX + this.patrolRadius),
        y: Phaser.Math.Clamp(this.npcOriginY + Math.sin(angle) * dist, this.npcOriginY - this.patrolRadius, this.npcOriginY + this.patrolRadius),
      }
    }

    if (this.patrolTarget) {
      const dx = this.patrolTarget.x - this.x
      const dy = this.patrolTarget.y - this.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 2) {
        this.patrolTarget = null
        // Stop — always face front (walk_down = toward viewer)
        this.anims.stop()
        this.setFrame(0)
        this.currentDir = 'down'
      } else {
        const speed = 20
        this.x += (dx / dist) * speed * (delta / 1000)
        this.y += (dy / dist) * speed * (delta / 1000)

        // Never play walk_up (shows back). When moving up, keep walk_down (face always visible).
        const rawDir: typeof this.currentDir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up')
        const playDir: typeof this.currentDir = rawDir === 'up' ? 'down' : rawDir
        const walkKey = `${this.texture.key}_walk_${playDir}`

        if (this.anims.currentAnim?.key !== walkKey && this.scene.anims.exists(walkKey)) {
          this.currentDir = playDir
          this.play(walkKey, true)
        }
      }
    }
  }
}
