import Area, { AREA_KEYS } from '../_classes/Area'

const arena = {
  id: AREA_KEYS.ARENA,
  name: 'Arena',
  tileMap: [
    [1, 2, 3, 4],
    [5, 6, 7, 8]
  ]
} as Area

export default new Area(arena)