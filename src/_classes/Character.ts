import { SavedCharacter } from '@/_types/SavedCharacter'
import GameObject from './GameObject'
import InputController from './InputController'
import type Renderer from './Renderer'

const VELOCITY = 2.5

export default class Character extends GameObject {
  id: number
  name: string
  health = {
    hp: 0,
    max: 0
  }
  level: number
  inputController: InputController
  queue: Map<number, string>
  cycle: number
  isJoined: boolean = false

  constructor(savedCharacter: SavedCharacter, renderer?: Renderer) {
    super(savedCharacter.area, renderer)
    this.id = savedCharacter.id
    this.name = savedCharacter.name
    this.level = savedCharacter.level
    this.health = savedCharacter.health
    this.area = savedCharacter.area
    this.inputController = new InputController(type => this.input(type))
    this.queue = new Map()
    this.cycle = 0
  }

  input(type: string) {
    this.queue.set(this.cycle, type)
    if (type === 'move-up-keydown') this.move('y', -VELOCITY)
    if (type === 'move-down-keydown') this.move('y', VELOCITY)
    if (type === 'move-left-keydown') this.move('x', -VELOCITY)
    if (type === 'move-right-keydown') this.move('x', VELOCITY)

    if (type === 'move-left-keyup' || type === 'move-right-keyup') this.move('x', 0)
    if (type === 'move-up-keyup' || type === 'move-down-keyup') this.move('y', 0)
  }

  setCycle(cycle: number) {
    this.cycle = cycle
  }

  move(axis: string, velocity: number) {
    if (axis === 'x') this.vx = velocity
    if (axis === 'y') this.vy = velocity
  }

  set setHp(hp: number) {
    this.health.hp = hp
  }

  update() {
    this.area.x += this.vx
    this.area.y += this.vy
  }

  draw() {
    // console.log('draw', this.area.x, this.area.y)
    this.renderer.drawCharacter(this)
  }
}