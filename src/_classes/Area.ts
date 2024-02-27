export const AREA_KEYS = {
  ARENA: 'ARENA'
}

class Tile {

  constructor() {
    
  }
}

export default class Area {
  id: string
  name: string
  tileMap: number[][]
  tiles: Tile[]

  constructor(area: Area) {
    this.id = area.id
    this.name = area.name
    this.tileMap = area.tileMap
    this.tiles = area.tiles
  }
}