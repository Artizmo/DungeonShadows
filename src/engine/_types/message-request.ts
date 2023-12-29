import { RawData, WebSocket } from 'ws'
import { IncomingMessage } from 'http'

export type MessageRequest = {
  message?: RawData, 
  connection?: WebSocket, 
  request?: IncomingMessage
}