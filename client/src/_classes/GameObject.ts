import type Renderer from './Renderer'

type AreaType = {
  id: string
}

export default class GameObject {
  renderer: Renderer
  x: number
  y: number
  vxw: number = 0
  vxe: number = 0
  vyn: number = 0
  vys: number = 0
  area: {
    id: string
  }

  constructor(area: AreaType, renderer: Renderer) {
    this.renderer = renderer
    this.area = area
  }
}