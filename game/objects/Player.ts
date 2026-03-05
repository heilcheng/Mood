import * as Phaser from 'phaser'

type Dir = 'down' | 'up' | 'left' | 'right'

export class Player extends Phaser.GameObjects.Container {
  private layers: Phaser.GameObjects.Sprite[] = []
  private facing: Dir = 'down'
  private isMoving = false
  private isCow: boolean
  private interactionZones: Set<string> = new Set()

  constructor(scene: Phaser.Scene, x: number, y: number, avatar = 'farmer_girl') {
    super(scene, x, y)
    this.isCow = avatar === 'cow'

    scene.add.existing(this)
    scene.physics.world.enable(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(10, 10)
    body.setOffset(-5, -10)
    body.setCollideWorldBounds(false)

    this.setDepth(5)
    this.buildLayers(avatar)
    this.playAnim('idle', 'down')

    if (this.isCow) this.scheduleMoo()
  }

  private scheduleMoo(): void {
    if (!this.scene || !this.active) return
    this.scene.time.delayedCall(Phaser.Math.Between(8000, 15000), () => {
      if (!this.active || !this.scene) return
      // Only moo when idle
      if (!this.isMoving) {
        const label = this.scene.add.text(this.x, this.y - 24, 'moo~', {
          fontSize: '7px', color: '#fff', fontFamily: 'monospace',
          stroke: '#333', strokeThickness: 2, resolution: 2,
        })
        label.setOrigin(0.5, 1).setDepth(15)
        this.scene.tweens.add({
          targets: label, y: label.y - 18, alpha: 0, duration: 1400,
          onComplete: () => label.destroy(),
        })
        // Small bounce
        this.scene.tweens.add({
          targets: this, y: this.y - 5, duration: 150, yoyo: true, ease: 'Sine.easeOut',
        })
      }
      this.scheduleMoo()
    })
  }

  private buildLayers(avatar: string): void {
    if (this.isCow) {
      // Player cow is the black/white variant; NPC cows use the brownwhite variant
      const sprite = new Phaser.GameObjects.Sprite(this.scene, 0, 0, 'cow_bw_ss', 0)
      sprite.setOrigin(0.5, 0.5)
      this.add(sprite)
      this.layers = [sprite]
      return
    }

    // Use pre-assembled character matching the avatar picker preview (char1=Rose, char3=Sol)
    const textureKey = avatar === 'farmer_girl' ? 'char1' : 'char3'
    const sprite = new Phaser.GameObjects.Sprite(this.scene, 0, 0, textureKey, 0)
    sprite.setOrigin(0.5, 1)
    this.add(sprite)
    this.layers = [sprite]
  }

  private playAnim(action: string, dir: Dir): void {
    if (this.isCow) {
      const sprite = this.layers[0]
      if (action === 'idle') {
        const idleKey = 'cow_bw_ss_idle'
        if (sprite.anims.currentAnim?.key !== idleKey && this.scene.anims.exists(idleKey)) {
          sprite.play(idleKey, true)
        }
      } else {
        const key = `cow_bw_ss_walk_${dir}`
        if (sprite.anims.currentAnim?.key !== key && this.scene.anims.exists(key)) {
          sprite.play(key, true)
        }
      }
      return
    }
    if (action === 'idle') {
      // Face forward: show frame 0 of walk_down (front-facing) when standing still
      this.layers.forEach((sprite) => {
        sprite.anims.stop()
        sprite.setFrame(0)
      })
      return
    }
    // Walking — never play walk_up (shows back); redirect to walk_down to keep face visible
    const rawDir = dir
    const playDir: Dir = rawDir === 'up' ? 'down' : rawDir
    const animDir = `walk_${playDir}`
    this.layers.forEach((sprite) => {
      const key = `${sprite.texture.key}_${animDir}`
      if (this.scene.anims.exists(key) && sprite.anims.currentAnim?.key !== key) {
        sprite.play(key, true)
      }
    })
  }

  move(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    wasd: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key },
    _delta: number,
    speed = 80
  ): void {
    const body = this.body as Phaser.Physics.Arcade.Body
    const sprint = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    const actualSpeed = sprint?.isDown ? speed * 1.6 : speed

    let vx = 0, vy = 0

    if (cursors.left.isDown  || wasd.left.isDown)  { vx = -actualSpeed; this.facing = 'left'  }
    else if (cursors.right.isDown || wasd.right.isDown) { vx =  actualSpeed; this.facing = 'right' }

    if (cursors.up.isDown   || wasd.up.isDown)   { vy = -actualSpeed; this.facing = 'up'   }
    else if (cursors.down.isDown  || wasd.down.isDown)  { vy =  actualSpeed; this.facing = 'down'  }

    if (vx !== 0 && vy !== 0) { const f = 1 / Math.sqrt(2); vx *= f; vy *= f }

    body.setVelocity(vx, vy)
    this.isMoving = vx !== 0 || vy !== 0
    this.playAnim(this.isMoving ? 'walk' : 'idle', this.facing)
  }

  addNearbyZone(id: string): void    { this.interactionZones.add(id) }
  removeNearbyZone(id: string): void { this.interactionZones.delete(id) }
  getNearestInteractable(): string | null {
    return this.interactionZones.size > 0 ? [...this.interactionZones][0] : null
  }
  getFacing(): string { return this.facing }
}
