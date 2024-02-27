import { ServerResponseHandlerType, ServerResponseHandlers } from '@/_types/ServerResponse'

export class ServerRequest {
  private connection: WebSocket

  constructor(connection: WebSocket) {
    this.connection = connection
  }

  send<T>(type: string, data: T) {
    console.log('bingo', JSON.stringify({ type, data }))
    this.connection.send(JSON.stringify({ type, data }))
  }
}

export class ServerResponse {
  private connection: WebSocket

  constructor(connection: WebSocket) {
    this.connection = connection
  }

  handle(type: string, responseHandler: ServerResponseHandlerType) {
    this.connection.addEventListener(type, data => {
      if (!type) return
      if (!responseHandler || typeof responseHandler !== 'function') return

      responseHandler(data)
    })
  }

  handleAll(type: string, responseHandlers: ServerResponseHandlers) {
    this.connection.addEventListener(type, (event: MessageEvent) => {
      const { data } = event
      if (!type || !data) return
      if (!responseHandlers.size) return

      const message = JSON.parse(data.toString())
      const handler = responseHandlers.get(message?.type)
      if (!handler || typeof handler !== 'function') return

      handler({ message, responseHandlers })
    })
  }
}