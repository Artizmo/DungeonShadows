import type Renderer from './Renderer'

type AreaType = {
  x: number
  y: number
  id: string
}

export default class GameObject {
  renderer: Renderer
  vx: number = 0
  vy: number = 0
  area: {
    x: number
    y: number
    id: string
  }

  constructor(area: AreaType, renderer: Renderer) {
    this.renderer = renderer
    this.area = area
  }

  setX(x: number) {
    this.area.x = x
  }

  setY(y: number) {
    this.area.y = y
  }
}