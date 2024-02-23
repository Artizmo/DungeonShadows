import { EventEmitter } from 'node:events'

export type GameEventListeners = Map<string, (arg: any) => void>

export default class GameEvent {
  emitter: EventEmitter = new EventEmitter

  emit<T>(type: string, data?: T) {
    this.emitter.emit(type, data)
  }

  addEventListeners(gameEventListeners: GameEventListeners) {
    for (const [type, listener] of gameEventListeners.entries()) {
      this.emitter.addListener(type, listener)
    }
  }

  removeEventListeners(gameEventListeners: GameEventListeners) {
    for (const [type, listener] of gameEventListeners.entries()) {
      this.emitter.removeListener(type, listener)
    }
  }
}