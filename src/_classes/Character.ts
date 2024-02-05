import InputController from './InputController'
import KeyboardMouseController from './KeyboardMouseController'

export default class Character {
  id: number
  name: string
  hp: number
  maxHp: number
  level: number

  constructor(character: Character = null) {
    this.id = character.id
    this.name = character.name
    this.level = character.level
    this.hp = character.hp
    this.maxHp = character.maxHp
  }

  update(character: Character) {
    // console.log('UPDATE CHAR', character)
  }
}