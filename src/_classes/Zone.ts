import NPC from './Npc'
import Item from './Item'

export default class Zone {
  id: number
  name: string
  mapSrc: string

  constructor(zone: Zone) {
    this.id = zone.id
    this.name = zone.name
    this.mapSrc = zone.mapSrc
  }
}