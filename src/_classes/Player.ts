import { type WebSocket, type WebSocketServer } from 'ws'
import { SavedPlayer } from '../_types/SavedPlayer'
import ServerConnection from './ServerConnection'

export default class Player extends ServerConnection {
  id: number
  email: string
  firstName: string
  lastName: string
  isAlive: boolean

  constructor(savedPlayer: SavedPlayer, server: WebSocketServer, connection: WebSocket) {
    super(server, connection)
    this.id = savedPlayer.id
    this.email = savedPlayer.email
    this.firstName = savedPlayer.firstName
    this.lastName = savedPlayer.lastName

    this.init()
  }
  
  init() {
    this.connection.on('pong', () => {
      this.isAlive = true
    })
  }

  set setIsAlive(isAlive: boolean) {
    this.isAlive = isAlive
  }
  
  ping() {
    this.connection.ping()
  }

  dispose() {
    this.connection.terminate()
  }
}