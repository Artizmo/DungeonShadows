import type GameEvents from './GameEvents'
import type GameServer from './GameServer'

export default class Npc {
  id: number
  name: string

  constructor(npc: Npc) {
    this.id = npc.id
    this.name = npc.name
  }

  update(gameServer: GameServer, gameEvents: GameEvents) {
    
  }
}