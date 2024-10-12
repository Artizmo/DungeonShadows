import sephus from './sephus'

export const AREA_KEYS = {
  SEPHUS: 1000
}

const areaList = new Map()
areaList.set(AREA_KEYS.SEPHUS, sephus)

export default areaList