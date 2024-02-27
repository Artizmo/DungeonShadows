import { type WebSocket, type WebSocketServer } from 'ws'
import { SavedCharacter } from '../_types/SavedCharacter'
import ServerConnection from './ServerConnection'
import GameEvents, { GameEventListeners } from './GameEvents'

export default class Character extends ServerConnection {
  gameEvents: GameEvents
  eventListeners: GameEventListeners
  id: number
  pid: number
  name: string
  level: number
  health: {
    hp: number
    max: number
  }
  area: {
    id: string
    x: number
    y: number
  }

  constructor(savedCharacter: SavedCharacter, server: WebSocketServer, connection: WebSocket, gameEvents: GameEvents) {
    super(server, connection)
    this.gameEvents = gameEvents
    this.id = savedCharacter.id
    this.pid = savedCharacter.pid
    this.name = savedCharacter.name
    this.level = savedCharacter.level
    this.health = savedCharacter.health
    this.area = savedCharacter.area
    
    this.eventListeners = new Map([
      ['character-join', data => this.join(data)],
      ['disconnect', data => this.disconnect(data)]
    ])
    
    this.gameEvents.addEventListeners(this.eventListeners)
  }

  disconnect(pid: number) {
    if (this.pid !== pid) return

    console.log('disconnecting!!!!!!!!!!!!', this.name)
  }

  join(cid: number) {
    if (this.id !== cid) return

    console.log('JOINED', this.name)
  }

  dispose() {
    console.log('disposing')
    this.gameEvents.removeEventListeners(this.eventListeners)
  }
}