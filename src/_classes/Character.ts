import { CharacterType } from '../_types/character'
import { ServerType } from '../_types/server'
import ServerEntity from '../_classes/ServerEntity'

export default class Character extends ServerEntity {
  id: number
  name: string
  level: number
  hp: number
  maxHp: number

  constructor(character: CharacterType, server: ServerType) {
    super(server)
    this.id = character.id
    this.name = character.name
    this.level = character.level
    this.maxHp = character.maxHp
    this.hp = character.hp
  }
}