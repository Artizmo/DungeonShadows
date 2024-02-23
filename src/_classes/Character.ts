import { type WebSocket, type WebSocketServer } from 'ws'
import { SavedCharacter } from '../_types/SavedCharacter'
import ServerConnection from './ServerConnection'
import GameServer from './GameServer'
import GameEvents, { GameEventListeners } from './GameEvents'

export default class Character extends ServerConnection {
  gameEvents: GameEvents
  eventListeners: GameEventListeners
  id: number
  pid: number
  name: string
  level: number
  hp: number
  maxHp: number
  x: number
  y: number
  roomId: number
  areaId: string

  constructor(savedCharacter: SavedCharacter, server: WebSocketServer, connection: WebSocket, gameEvents: GameEvents) {
    super(server, connection)
    this.gameEvents = gameEvents
    this.id = savedCharacter.id
    this.pid = savedCharacter.pid
    this.name = savedCharacter.name
    this.level = savedCharacter.level
    this.maxHp = savedCharacter.maxHp
    this.hp = savedCharacter.hp
    this.x = savedCharacter.x
    this.y = savedCharacter.y
    this.roomId = savedCharacter.roomId
    this.areaId = savedCharacter.areaId
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