import type { Plant } from '@/lib/types'

interface GameInitData {
  plants?: Plant[]
  avatar?: string
  unlockedItems?: string[]
}

export async function createPhaserGame(
  parent: HTMLElement,
  initData: GameInitData = {}
): Promise<{ game: unknown; destroy: () => void }> {
  const Phaser = (await import('phaser')).default
  const { BootScene } = await import('./scenes/BootScene')
  const { FarmScene } = await import('./scenes/FarmScene')

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth || 800,
    height: parent.clientHeight || 600,
    backgroundColor: '#87CEEB',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, FarmScene],
    pixelArt: true,
    antialias: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: {
      disableWebAudio: false,
    },
  }

  const game = new Phaser.Game(config)

  // Store initData on game object before BootScene.create() runs — BootScene forwards it to FarmScene
  ;(game as unknown as Record<string, unknown>)._initData = initData

  const destroy = () => {
    game.destroy(true)
  }

  return { game, destroy }
}
