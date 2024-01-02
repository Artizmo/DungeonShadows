import { WebSocket } from 'ws'

export default class Player {
  id: number
  email: string
  firstName: string
  lastName: string
  token: string
  ipAddress: string
  isAlive: boolean
  connection: WebSocket

  constructor(user: any, connection: WebSocket, token: string, ipAddress: string, isAlive: boolean) {
    this.id = user.id
    this.email = user.email
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.ipAddress = ipAddress
    this.isAlive = isAlive
    this.connection = connection
    this.token = token
  }
}