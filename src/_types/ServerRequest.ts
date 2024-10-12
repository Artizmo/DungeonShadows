import { WebSocket } from 'ws'
import { IncomingMessage } from 'http'

type ServerMessage<T> = {
  type: string
  data: T
}

export type RequestHandlers = Map<string, (arg: any) => void>

export type Request<T> = { 
  message: ServerMessage<T>
  connection?: WebSocket
  request?: IncomingMessage
  requestHandlers: RequestHandlers
}