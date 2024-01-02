import { ServerType } from '../_types/server'
import { CharacterType } from '../_types/character'
import ServerEntity from './ServerEntity'

export default class World extends ServerEntity {
  characters: Map<number, CharacterType>

  constructor(server: ServerType) {
    super(server)
    this.characters = new Map()
  }

  addCharacter(character: CharacterType) {
    this.characters.set(character.id, character)
  }

  removeCharacter(character: CharacterType) {
    this.characters.delete(character.id)
  }

  update(pulse: boolean) {
    super.update(pulse)
  }

  draw() {
    super.draw()
  }
}