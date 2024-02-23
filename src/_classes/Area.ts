class Tile {

  constructor() {
    
  }
}

export default class Area {
  id: string
  name: string
  map: number[][]
  tiles: Tile[]

  constructor(area: Area) {
    this.id = area.id
    this.name = area.name
    this.map = area.map
    this.tiles = area.tiles

    this.init()
  }

  init() {

  }
}