class Room {
  x: number
  y: number
  width: number

  constructor(x: number, y: number, width: number) {
    this.x = x
    this.y = y
    this.width = width
  }

  draw() {

  }
}

export default class Renderer {
  private maps: Map<string, CanvasRenderingContext2D>

  constructor() {
    this.maps = new Map()
  }

  setMap(type: string, canvas: HTMLCanvasElement) {
    if (!canvas) return

    const dpr = window.devicePixelRatio
    const rect = canvas.getBoundingClientRect()
    const tilesMap = canvas.getContext('2d')
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    tilesMap.scale(dpr, dpr)
    this.maps.set(type, tilesMap)
  }
 
  getColor() {
    const r = 255*Math.random()|0
    const g = 255*Math.random()|0
    const b = 255*Math.random()|0

    return `rgb(${255*Math.random()|0}, ${255*Math.random()|0}, ${255*Math.random()|0})`
  }

  drawRoom() {
    const tilesMap = this.maps.get('tiles')
    if (!tilesMap) return

    tilesMap.beginPath()
    tilesMap.rect(1, 1, 50, 50)
    tilesMap.strokeStyle = '#d6d6d6'
    tilesMap.lineWidth = 2
    tilesMap.stroke()
  }
}

/*

load character
load area character is in
draw tiles if characters with camera


*/