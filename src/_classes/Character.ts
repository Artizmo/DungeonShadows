import { SavedCharacter } from '@/_types/SavedCharacter'
import GameObject from './GameObject'
import InputController from './InputController'



export default class Character extends GameObject {
  id: number
  name: string
  hp: number
  maxHp: number
  level: number
  inputController: InputController
  queue: Map<number, string>
  cycle: number

  constructor(character: SavedCharacter = null) {
    super(character.x, character.y)
    this.id = character.id
    this.name = character.name
    this.level = character.level
    this.hp = character.hp
    this.maxHp = character.maxHp
    this.inputController = new InputController(type => this.input(type))
    this.queue = new Map()
    this.cycle = 0
  }

  input(type: string) {
    this.queue.set(this.cycle, type)
    if (type === 'move-right') {
      this.move('right')
    }
    if (type === 'move-left') {
      this.move('left')
    }
  }

  setCycle(cycle: number) {
    this.cycle = cycle
  }

  move(direction: string) {
    if (direction === 'right') {
      this.setX(this.x += 1)
    }
    if (direction === 'left') {
      this.setX(this.x -= 1)
    }
  }

  update(character: Character) {

  }

  draw() {
    // console.log('queue', this.queue)
  }
}