import Area from '../_classes/Area'

const arena = {
  id: 'arena',
  name: 'arena',
  map: [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16]
  ]
} as Area

export default new Area(arena)