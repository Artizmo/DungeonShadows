import Act from '../../_classes/Act'
import Area from '../../_classes/Area'
import Zone from '../../_classes/Zone'

const Sephus = new Area({
  id: 1000,
  name: 'Sephus',
  createDate: null,
  modifiedDate: null,
  author: 'Brian Selvaggio',
  acts: new Map(),
  zones: new Map(),
  npcs: new Map(),
  items: new Map()
} as Area)

const a = new Act('LOAD', (gameServer, gameEvents) => {
  console.log('bingo act!', Sephus.name)
})

const a2 = new Act('RANDOM', (areas, gameServer, gameEvents) => {
  const area = areas.get(Sephus.id)

  // console.log('bingo random act', area.zones.get(TavernField.id).name)
})

const TavernField = new Zone({
  id: 1000,
  name: 'Tavern Fields',
  mapSrc: 'areas/tavern'
})

Sephus.acts.set(1000, a)
Sephus.acts.set(1001, a2)
Sephus.zones.set(TavernField.id, TavernField)

export default Sephus