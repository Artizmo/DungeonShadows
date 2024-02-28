const CYCLE_RATE = JSON.parse(process.env.NEXT_PUBLIC_CYCLERATE)
const CYCLE_SIZE = JSON.parse(process.env.NEXT_PUBLIC_CYCLESIZE)

type LoopDetails = {
  cycle: number
  fps: number
}

export default class GameLoop {
  private cycleTime: number
  private lastTime: number
  private fpsTimes: number[] = []
  private fps: number
  private input: () => void
  private update: (arg: LoopDetails) => void
  private draw: () => void
  cycle: number

  constructor() {
    this.cycle = 0
    this.cycleTime = 0 
    this.fps = null
    this.lastTime = new Date().getTime()  
  }

  start(input: () => void, update: (data: LoopDetails) => void, draw: () => void) { 
    this.input = input
    this.update = update
    this.draw = draw
    this.loop()
  }

  private loop() {
    window.requestAnimationFrame(() => {
      // game frame

      const { cycle, fps } = this
      this.update({ cycle, fps })
      this.draw()

      while (this.cycleTime >= CYCLE_RATE) {
        // game cycle
      
        this.input()

        this.updateCycle()
      }

      this.updateFrame()
      this.updateFPS()
      this.loop()
    })
  }

  private updateCycle() {
    this.cycleTime -= CYCLE_RATE
    this.cycle = this.cycle % CYCLE_SIZE + 1
  }

  private updateFrame() {
    const currentTime = new Date().getTime()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.cycleTime += deltaTime
    this.lastTime = currentTime
  }

  private updateFPS() {
    const now = performance.now()
    const frames = this.fpsTimes.length

    while (frames > 0 && this.fpsTimes[0] <= now - 1000) {
      this.fpsTimes.shift()
    }
    this.fpsTimes.push(now)
    this.fps = frames > 60 ? 60 : frames
  }
}