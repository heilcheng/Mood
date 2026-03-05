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
    backgroundColor: '#7ec850',
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

  // Pass init data to FarmScene after boot
  game.events.once('ready', () => {
    const bootScene = game.scene.getScene('BootScene')
    if (bootScene) {
      // Data will be passed via scene start in BootScene → FarmScene
      ;(game as unknown as Record<string, unknown>)._initData = initData
    }
  })

  // Override BootScene create to pass data to FarmScene
  game.events.on('step', () => {
    const farmScene = game.scene.getScene('FarmScene')
    const storedData = (game as unknown as Record<string, unknown>)._initData as GameInitData | undefined
    if (farmScene && storedData && !(game as unknown as Record<string, unknown>)._dataInjected) {
      ;(game as unknown as Record<string, unknown>)._dataInjected = true
      // FarmScene will pick up data from init() on next scene start
    }
  })

  const destroy = () => {
    game.destroy(true)
  }

  return { game, destroy }
}
