import { EventEmitter } from "node:events";
import { GameEventListeners } from "../types/game";

export default class GameEvents {
  emitter: EventEmitter = new EventEmitter();

  emit<T>(type: string, data?: T) {
    this.emitter.emit(type, data);
  }

  addEventListeners(gameEventListeners: GameEventListeners) {
    for (const [type, listener] of gameEventListeners.entries()) {
      this.emitter.addListener(type, listener);
    }
  }

  removeEventListeners(gameEventListeners: GameEventListeners) {
    for (const [type, listener] of gameEventListeners.entries()) {
      this.emitter.removeListener(type, listener);
    }
  }
}