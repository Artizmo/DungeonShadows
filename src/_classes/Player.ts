import { WebSocket } from 'ws'
import { PlayerType } from '../_types/player'

export default class Player {
  id: number
  email: string
  firstName: string
  lastName: string
  token: string
  ipAddress: string
  isAlive: boolean
  connection: WebSocket

  constructor(player: PlayerType) {
    this.id = player.id
    this.email = player.email
    this.firstName = player.firstName
    this.lastName = player.lastName
    this.isAlive = player.isAlive
    this.token = player.token
    this.connection = player.connection
  }
}