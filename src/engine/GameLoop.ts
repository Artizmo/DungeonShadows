const TICK_RATE = 60
const BUFFER_SIZE = 250

export default class GameLoop {
  currentTick: number
  currentTime: number
  deltaTime: number
  lastTime: number
  minTimeBetweenTicks: number
  timer: number

  constructor() {
    this.currentTick = 0
    this.currentTime = 0
    this.deltaTime = 0
    this.lastTime = new Date().getTime()
    this.minTimeBetweenTicks = TICK_RATE
    this.timer = 0
  }

  start() {
    // game loop update
    setInterval(() => {
      // frame rate loop - 60 per 1 second
      this.currentTime = new Date().getTime()
      this.deltaTime = (this.currentTime - this.lastTime) / 1000
      this.timer += this.deltaTime
      while (this.timer >= this.minTimeBetweenTicks) {
        this.timer -= this.minTimeBetweenTicks
        this.tick()
      }
      this.lastTime = this.currentTime
    }, 1000/60)
  }

  tick() {
    this.currentTick = this.currentTick % BUFFER_SIZE + 1
    console.log('process tick', this.currentTick)
  }
}