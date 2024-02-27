import { Config } from '../_types/Config'

type Callback = () => void

export default class GameLoop {
  private config: Config
  private frameTime: number
  private lastTime: number
  private tickTime: number
  private update: Callback
  private tick: Callback
  cycle: number
  
  constructor(config: Config, update: Callback, tick: Callback) {
    this.config = config
    this.update = update
    this.tick = tick
    this.config = config
    this.cycle = 0
    this.lastTime = new Date().getTime()
    this.frameTime = 0
    this.tickTime = 0

    this.loop()
  }

  private loop() {
    setInterval(() => {
      // game frame

      while (this.frameTime >= this.config.cycleRate) {
        // game cycle
        
        this.update()
        
        // output()

        if (this.tickTime >= this.config.tickRate) {
          // game tick
          
          this.tick()
          this.tickTime = 0
        }

        this.updateCycle()
      }

      this.updateFrame()
    }, 1000/this.config.fps)
  }
  
  private updateCycle() {
    this.tickTime += this.frameTime
    this.frameTime -= this.config.cycleRate
    this.cycle = this.cycle % this.config.cycleSize + 1
  }

  private updateFrame() {
    const currentTime = new Date().getTime()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.frameTime += deltaTime
    this.lastTime = currentTime
  }
}