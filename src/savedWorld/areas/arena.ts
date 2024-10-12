import Area, { Zone, Tile, AREA_KEYS } from '../../_classes/Area'

const tiles = new Map([
  [[0, 0], new Tile({ id: 1, x: 0, y: 0 })]
])

const zones = new Map([
  [1, new Zone({ id: 1, tiles: [1] })]
])

const arena = {
  id: AREA_KEYS.ARENA,
  name: 'Sephus Beta',
  createDate: null,
  modifiedDate: null,
  author: 'Brian Selvaggio',
  zones: [
    { 
  //     id: 1,
  //     name: 'Arena',
  //     mapSrc: '',
  //     tileMap: [
  //       [1]
  //     ],
  //     tiles,
    }
  ],
  npcs: [],
  objects: []
} as Area

export default new Area(arena)