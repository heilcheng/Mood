import * as Phaser from 'phaser'

export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: 'down' | 'up' | 'left' | 'right' = 'down'
  private walkFrame = 0
  private frameTimer = 0
  private readonly frameDuration = 150
  private isMoving = false
  private avatar = 'farmer_girl'
  private interactionZones: Set<string> = new Set()

  constructor(scene: Phaser.Scene, x: number, y: number, avatar = 'farmer_girl') {
    super(scene, x, y, `${avatar}_down_0`)
    this.avatar = avatar
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(10, 10)
    body.setOffset(3, 6)

    this.setDepth(5)
    this.setOrigin(0.5, 1)
  }

  setAvatar(avatar: string): void {
    this.avatar = avatar
    this.setTexture(`${avatar}_${this.facing}_0`)
  }

  move(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    wasd: {
      up: Phaser.Input.Keyboard.Key
      down: Phaser.Input.Keyboard.Key
      left: Phaser.Input.Keyboard.Key
      right: Phaser.Input.Keyboard.Key
    },
    delta: number,
    speed = 80
  ): void {
    const body = this.body as Phaser.Physics.Arcade.Body
    const sprint = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    const actualSpeed = sprint?.isDown ? speed * 1.6 : speed

    let vx = 0
    let vy = 0

    if (cursors.left.isDown || wasd.left.isDown) {
      vx = -actualSpeed
      this.facing = 'left'
    } else if (cursors.right.isDown || wasd.right.isDown) {
      vx = actualSpeed
      this.facing = 'right'
    }

    if (cursors.up.isDown || wasd.up.isDown) {
      vy = -actualSpeed
      this.facing = 'up'
    } else if (cursors.down.isDown || wasd.down.isDown) {
      vy = actualSpeed
      this.facing = 'down'
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const factor = 1 / Math.sqrt(2)
      vx *= factor
      vy *= factor
    }

    body.setVelocity(vx, vy)
    this.isMoving = vx !== 0 || vy !== 0

    // Animate walk cycle
    if (this.isMoving) {
      this.frameTimer += delta
      if (this.frameTimer >= this.frameDuration) {
        this.frameTimer = 0
        this.walkFrame = (this.walkFrame + 1) % 3
      }
    } else {
      this.walkFrame = 0
      this.frameTimer = 0
    }

    this.setTexture(`${this.avatar}_${this.facing}_${this.walkFrame}`)
  }

  addNearbyZone(id: string): void {
    this.interactionZones.add(id)
  }

  removeNearbyZone(id: string): void {
    this.interactionZones.delete(id)
  }

  getNearestInteractable(): string | null {
    if (this.interactionZones.size === 0) return null
    return [...this.interactionZones][0]
  }

  getFacing(): string {
    return this.facing
  }
}
