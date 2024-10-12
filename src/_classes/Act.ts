import type GameEvents from '../_classes/GameEvents'
import type GameServer from '../_classes/GameServer'
import type Area from './Area'

export default class Act {
  type: string
  enabled: boolean
  callback: (areas: Map<number, Area>, gameServer: GameServer, gameEvents: GameEvents) => void

  constructor(type: string, callback: (areas: Map<number, Area>, gameServer: GameServer, gameEvents: GameEvents) => void) {
    this.type = type
    this.enabled = true
    this.callback = callback
  }

  update(areas: Map<number, Area>, gameServer: GameServer, gameEvents: GameEvents) {
    if (!this.enabled) return

    if (this.type === 'LOAD') {
      this.enabled = false
    }
    
    this.callback(areas, gameServer, gameEvents)
  }
}