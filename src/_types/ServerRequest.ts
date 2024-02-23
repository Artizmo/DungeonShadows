import { WebSocket } from 'ws'
import { IncomingMessage } from 'http'

type ServerMessage<T> = {
  type: string
  data: T
}

export type ServerRequestHandlers = Map<string, (arg: any) => void>

export type ServerRequest<T> = { 
  message: ServerMessage<T>
  connection: WebSocket
  request: IncomingMessage
  requestHandlers: ServerRequestHandlers
}