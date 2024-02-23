import { ServerResponse, ServerResponseHandlers } from '@/_types/ServerResponse'

export default class ClientObject {
  private connection: WebSocket

  constructor(connection: WebSocket) {
    this.connection = connection
  }

  serverResponseHandlers(responseHandlers: ServerResponseHandlers) {
    this.connection.onmessage = data => {
      const message = JSON.parse(data.toString())
      ClientObject.serverResponse({ message, responseHandlers })
    }
  }

  static serverResponse<T>(serverResponse: ServerResponse<T>) {
    const { responseHandlers, message } = serverResponse
    if (!responseHandlers.size) return
    
    const handler = responseHandlers.get(message?.type)
    if (!handler || typeof handler !== 'function') return
    
    handler(serverResponse)
  }
}