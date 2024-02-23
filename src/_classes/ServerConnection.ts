import { WebSocket, WebSocketServer } from 'ws'
import { ServerRequest, ServerRequestHandlers } from '../_types/ServerRequest'

export default class ServerConnection {
  server: WebSocketServer
  connection: WebSocket

  constructor(server: WebSocketServer, connection?: WebSocket) {
    this.server = server
    this.connection = connection
  }

  serverRequestHandlers(requestHandlers: ServerRequestHandlers) {
    this.server.on('connection', (connection, request) => {
      connection.on('message', data => {
        const message = JSON.parse(data.toString())
        ServerConnection.serverRequest({ message, requestHandlers, connection, request })
      })
    })
  }

  static serverRequest<T>(serverRequest: ServerRequest<T>) {
    const { requestHandlers, message } = serverRequest
    if (!requestHandlers.size) return

    const handler = requestHandlers.get(message?.type)
    if (!handler || typeof handler !== 'function') return

    handler(serverRequest)
  }
}