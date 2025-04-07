import { type WebSocket } from 'ws'
import { SavedPlayer } from '../types/SavedPlayer'

export default class Player {
  id: number
  email: string
  firstName: string
  lastName: string
  isAlive: boolean = true
  connection: WebSocket

  constructor(savedPlayer: SavedPlayer, connection: WebSocket) {
    this.id = savedPlayer.id
    this.email = savedPlayer.email
    this.firstName = savedPlayer.firstName
    this.lastName = savedPlayer.lastName
    this.connection = connection

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