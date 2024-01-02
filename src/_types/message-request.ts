import { RawData, WebSocket } from 'ws'
import { IncomingMessage } from 'http'

export type MessageRequestType = {
  message?: RawData, 
  connection?: WebSocket, 
  request?: IncomingMessage
}