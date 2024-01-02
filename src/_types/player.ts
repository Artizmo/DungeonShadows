import { WebSocket } from 'ws'

export type PlayerType = {
  id: number
  email: string
  firstName: string
  lastName: string
  token: string
  ipAddress: string
  isAlive: boolean
  connection: WebSocket
}