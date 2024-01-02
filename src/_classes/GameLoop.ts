import { ServerEntityType } from '../_types/server-entity'
import { ConfigType } from '../_types/config'

export default class GameLoop {
  private baseEntity: ServerEntityType
  private config: ConfigType
  private lastTime: number
  private updateTimer: number
  private tickTimer: number
  currentTick: number

  constructor(config: ConfigType) {
    this.config = config
    this.currentTick = 0
    this.lastTime = new Date().getTime()
    this.tickTimer = 0
    this.updateTimer = 0
  }

  start(baseEntity: ServerEntityType) {
    // game loop update
    this.baseEntity = baseEntity

    setInterval(() => {
      // frame tick
    
      while (this.tickTimer >= this.config.tickRate) {
        // game tick
        
        if (this.updateTimer >= this.config.updateTicks) {
          // game pulse
          this.update(true)
        }

        this.tick()
      }
      
      // input state
      this.input()

      // update state
      this.update()

      // draw state
      this.draw()

      this.updateClock()
    }, 1000/this.config.fps)
  }

  input() {
    // update state
  }

  update(pulse: boolean = false) {
    if (pulse) this.updateTimer = 0

    this.baseEntity.update(pulse)
  }

  draw() {
    this.baseEntity.draw()
  }

  tick() {
    this.updateTimer += this.tickTimer
    this.tickTimer -= this.config.tickRate
    this.currentTick = this.currentTick % this.config.tickSize + 1
  }

  updateClock() {
    const currentTime = new Date().getTime()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.tickTimer += deltaTime
    this.lastTime = currentTime
  }
}