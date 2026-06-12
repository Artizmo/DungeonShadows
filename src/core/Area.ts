import type GameEvents from '../../lib/classes/GameEvents'
import type GameServer from '../../../server/GameServer'
import Act from '../../../lib/classes/Act'
import Item from '../../lib/classes/Item'
import NPC from '../game/world/classes/Npc'
import Zone from './Zone'

export default class Area {
  id: number
  name: string
  createDate: Date
  modifiedDate: Date
  author: string
  acts: Map<number, Act>
  zones: Map<number, Zone>
  npcs: Map<number, NPC>
  items: Map<number, Item>

  constructor(area: Area) {
    this.id = area.id
    this.name = area.name
    this.createDate = area.createDate
    this.modifiedDate = area.modifiedDate
    this.author = area.author
    this.acts = area.acts
    this.zones = area.zones
    this.npcs = area.npcs
    this.items = area.items
  }

  update(areas: Map<number, Area>, gameServer: GameServer, gameEvents: GameEvents) {
    for (const act of this.acts.values()) {
      act.update(areas, gameServer, gameEvents)
    }
  }
}