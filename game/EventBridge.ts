import type { Plant, WeatherState } from '@/lib/types'

type EventMap = {
  // Phaser → React
  openJournal: void
  openBreathing: void
  talkNPC: { npcId: string; message: string }
  inspectPlot: { tileX: number; tileY: number }
  nearbyInteractable: { id: string | null }
  questProgress: { questKey: string; progress: number; completed: boolean }

  // React → Phaser
  plantAdded: Plant
  journalCompleted: void
  weatherChanged: WeatherState
  growthBoost: void
  dayNightTick: { phase: 'day' | 'dusk' | 'night' }
  avatarChanged: { avatar: string }
}

type Listener<T> = (data: T) => void

class TypedEventEmitter {
  private listeners: Map<string, Set<Listener<unknown>>> = new Map()

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>)
    return () => this.off(event, listener)
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>)
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.listeners.get(event)?.forEach((l) => l(data))
  }

  once<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    const wrapped = (data: EventMap[K]) => {
      listener(data)
      this.off(event, wrapped)
    }
    this.on(event, wrapped)
  }
}

export const EventBridge = new TypedEventEmitter()
