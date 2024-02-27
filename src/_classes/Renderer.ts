import type Character from './Character'

export default class Renderer {
  private canvases: Map<string, { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }>

  constructor() {
    this.canvases = new Map()
  }

  setCanvas(type: string, canvas: HTMLCanvasElement) {
    if (!canvas) return

    // const dpr = window.devicePixelRatio
    // const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    // canvas.width = rect.width * dpr
    // canvas.height = rect.height * dpr
    // ctx.scale(dpr, dpr)
    this.canvases.set(type, { canvas, ctx })
  }
 
  getColor() {
    const r = 255*Math.random()|0
    const g = 255*Math.random()|0
    const b = 255*Math.random()|0

    return `rgb(${255*Math.random()|0}, ${255*Math.random()|0}, ${255*Math.random()|0})`
  }

  drawCharacter(c: Character) {
    if (this.canvases.size === 0) return

    const { canvas, ctx } = this.canvases.get('tiles')
    this.clearCanvas(canvas)
    ctx.fillStyle = 'green'
    ctx.beginPath()
    ctx.arc(c.area.x, c.area.y, 10, 0, Math.PI * 2)
    ctx.fill()
  }

  clearCanvas(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
  }
}

/*

load character
load area character is in
draw tiles if characters with camera


*/