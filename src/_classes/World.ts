import { type WebSocketServer } from 'ws'
import { SavedWorld } from '../_types/SavedWorld'
import { SavedCharacter } from '../_types/SavedCharacter'
import ServerConnection from './ServerConnection'
import Character from './Character'
import Area from './Area'
import GameEvents, { GameEventListeners } from './GameEvents'

export default class World extends ServerConnection {
  name: string
  gameEvents: GameEvents
  eventListeners: GameEventListeners
  characters: Map<number, Character>
  areas: Map<Number, Area>

  constructor(areas: Map<Number, Area>, savedWorld: SavedWorld, server: WebSocketServer, gameEvents: GameEvents) {
    super(server)
    this.gameEvents = gameEvents
    this.name = savedWorld.name
    this.characters = new Map()
    this.areas = areas
    this.eventListeners = new Map([
      ['join', data => this.handleJoinEvent(data)],
      ['disconnect', data => this.handleDisconnectEvent(data)],
      ['abort', () => this.handleAbortEvent()]
    ])
    
    this.gameEvents.addEventListeners(this.eventListeners)
  }

  private handleJoinEvent(savedCharacter: SavedCharacter) {
    if (!savedCharacter) return

    const character = new Character(savedCharacter, this.server, this.connection, this.gameEvents)
    this.addCharacter(character)

    this.gameEvents.emit('character-join', character.id)
  }

  private handleDisconnectEvent(pid: number) {
    if (!pid) return

    for (const character of this.characters.values()) {
      if (character.pid === pid) {
        character.dispose()
        this.removeCharacter(character.id)
      }
    }
  }

  private handleAbortEvent() {
    this.shutdown()
  }

  private shutdown() {
    this.save()
    this.gameEvents.removeEventListeners(this.eventListeners)
  }

  addCharacter(character: Character) {
    console.log('adding char', character.id)
    this.characters.set(character.id, character)
  }

  removeCharacter(cid: number) {
    console.log('removing character id', cid)
    this.characters.delete(cid)
  }

  save() {
    console.log('\nsaving world state...')
    this.characters.forEach(character => {
      console.log('saving player and character states...', character.name)
    })
  }
}