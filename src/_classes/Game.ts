import Character from './Character'

const PORT = JSON.parse(process.env.NEXT_PUBLIC_PORT)
const CYCLE_RATE = JSON.parse(process.env.NEXT_PUBLIC_CYCLERATE)
const CYCLE_SIZE = JSON.parse(process.env.NEXT_PUBLIC_CYCLESIZE)


let times = []

export default class Game {
  private cycleTime: number
  private lastTime: number
  character: Character
  connection: WebSocket
  currentCycle: number
  pid: number
  fps: number
  test: boolean
  
  constructor() {
    this.currentCycle = 0
    this.lastTime = new Date().getTime()
    this.cycleTime = 0
    this.connection = null
    this.character = null
    this.pid = null
    this.fps = null
  }

  start(pid: number) {
    try {
      this.pid = pid
      this.connection = new WebSocket(`ws://localhost:${PORT}`)
      this.connection.onopen = () => {
        this.connection.send(JSON.stringify({ type: 'connect', data: pid }))
      }
      this.connection.onmessage = ({ data }) => this.message(JSON.parse(data))
      this.loop()
    } catch(error) {
      console.log(error)
    }
  }

  loop() {
    window.requestAnimationFrame(() => {
      // game frame
      
      while (this.cycleTime >= CYCLE_RATE) {
        // game cycle
        
        this.update()

        this.draw()

        this.updateCycle()
      }

      this.updateFrame()
      this.updateFPS()

      this.loop()
    })
  }

  update() {
    const { currentCycle, fps } = this
    this.connection.dispatchEvent(new CustomEvent('update', { 
      detail: { 
        currentCycle,
        fps
      }
    }))
  }

  draw() {
    // if (this.test) return

    // const canvas = <HTMLCanvasElement>document.getElementById('bgMap')
    // if (!canvas) return
    // const ctx = canvas.getContext('2d')
    // if (!ctx) return
    // const dpr = window.devicePixelRatio ?? 1
    // const rect = canvas.getBoundingClientRect()
    // canvas.width = rect.width * dpr
    // canvas.height = rect.height * dpr
    // ctx.scale(dpr, dpr)
    // const img = new Image()
    // img.onload = () => {
    //   ctx.drawImage(img, 0, 0, rect.width, rect.height)
    // }
    // img.src = 'https://preview.redd.it/i-made-a-new-background-for-my-game-this-time-for-an-intro-v0-o17eipie3ijb1.png?auto=webp&s=bd42aade65ca45a341a8b0f7129b1187e9b0e6cb'
    // this.test = true
  }

  message<T>(data: { type: string, payload: T }) {
    const { type, payload } = data
    if (type === 'join') this.addCharacter(<Character>payload)
    if (type === 'character') this.updateCharacter(<Character>payload)
    if (type === 'available-characters') this.showAvailableCharacters(<Character[]>payload)
    if (type === 'ping') this.setPing(<number>payload)
  }

  join(cid: number) {
    this.connection.send(JSON.stringify({ type: 'join', data: { cid, pid: this.pid } }))
  }

  logout() {
    this.connection.send(JSON.stringify({ type: 'disconnect', data: this.pid }))
  }

  close() {
    this.connection.close()
  }

  isReady() {
    return this.connection.readyState === 1
  }

  private setPing(ping: number) {
    this.connection.dispatchEvent(new CustomEvent('ping', { detail: ping }))
  }

  private showAvailableCharacters(characters: Character[]) {
    this.connection.dispatchEvent(new CustomEvent('available-characters', { detail: characters }))
  }

  private addCharacter(character: Character) {
    this.character = new Character(character)
    this.connection.dispatchEvent(new CustomEvent('character', { detail: character }))
  }

  private updateCharacter(character: Character) {
    this.character.update(character)
    this.connection.dispatchEvent(new CustomEvent('character', { detail: character }))
  }

  private updateCycle() {
    this.cycleTime -= CYCLE_RATE
    this.currentCycle = this.currentCycle % CYCLE_SIZE + 1
  }

  private updateFrame() {
    const currentTime = new Date().getTime()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.cycleTime += deltaTime
    this.lastTime = currentTime
  }

  private updateFPS() {
    const now = performance.now()
    const frames = times.length
    while (frames > 0 && times[0] <= now - 1000) {
      times.shift()
    }
    times.push(now)
    this.fps = frames > 60 ? 60 : frames
  }
}