import { SavedCharacter } from '@/_types/SavedCharacter'
import GameObject from './GameObject'
import InputController, { INPUT_TYPES } from './InputController'
import type Renderer from './Renderer'

const VELOCITY = 2

type MoveInputType = {
  dir: string
  keyDown: boolean
}

type InputType = {
  type: string
  input: any
}

export default class Character extends GameObject {
  connection: WebSocket
  id: number
  name: string
  health = {
    hp: 0,
    max: 0
  }
  level: number
  inputController: InputController
  inputHistory: Map<Number, InputType[]>
  queue: Map<Number, InputType>
  cycle: number
  isJoined: boolean = false
  dx: number
  dy: number

  constructor(savedCharacter: SavedCharacter, connection: WebSocket, renderer?: Renderer) {
    super(savedCharacter.area, renderer)
    this.connection = connection
    this.id = savedCharacter.id
    this.name = savedCharacter.name
    this.level = savedCharacter.level
    this.health = savedCharacter.health
    this.x = savedCharacter.x
    this.y = savedCharacter.y
    this.dx = 0
    this.dy = this.y
    this.area = savedCharacter.area
    this.inputController = new InputController(type => this.input(type))
    this.queue = new Map()
    this.cycle = 0
  }

  input(input: InputType) {
    if (input.type === 'MOVE') this.move(input)
  }
  
  move({ input }: { type: string, input: MoveInputType }) {
    const { dir, keyDown } = input
    
    if (dir === INPUT_TYPES.MOVE_NORTH) this.vyn = keyDown ? -VELOCITY : 0
    if (dir === INPUT_TYPES.MOVE_SOUTH) this.vys = keyDown ? VELOCITY : 0
    if (dir === INPUT_TYPES.MOVE_WEST) this.vxw = keyDown ? -VELOCITY : 0
    if (dir === INPUT_TYPES.MOVE_EAST) this.vxe = keyDown ? VELOCITY : 0
  }
  
  lerp(v0: number, v1: number, t: number) {
    if (v0 < v1) Math.ceil(v0 + t * (v1 - v0))
    
    return Math.floor(v0 + t * (v1 - v0))
  }
  
  update({ cycle }) {
    this.cycle = cycle

    if (this.vxe) this.queue.set(this.cycle, { type: 'MOVE', input: { dir: INPUT_TYPES.MOVE_EAST } })
    if (this.vxw) this.queue.set(this.cycle, { type: 'MOVE', input: { dir: INPUT_TYPES.MOVE_WEST } })
    if (this.vyn) this.queue.set(this.cycle, { type: 'MOVE', input: { dir: INPUT_TYPES.MOVE_NORTH } })
    if (this.vys) this.queue.set(this.cycle, { type: 'MOVE', input: { dir: INPUT_TYPES.MOVE_SOUTH } })

    this.x = this.lerp(this.x, this.x + this.vxw, 1)
    this.x = this.lerp(this.x, this.x + this.vxe, 1)
    this.y = this.lerp(this.y, this.y + this.vyn, 1)
    this.y = this.lerp(this.y, this.y + this.vys, 1)
  }
  
  draw() {
    this.renderer.drawCharacter(this)
  }

  // setCycle(cycle: number) {
  //   this.cycle = cycle
  // }

  set setHp(hp: number) {
    this.health.hp = hp
  }
}