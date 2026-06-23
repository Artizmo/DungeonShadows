import { ServerResponseType } from '@/_types/ServerResponse'
import { PingTimes } from '@/_types/PingTimes'
import { REQUEST_TYPES, RESPONSE_TYPES } from '@/_lib/constants'
import { ServerResponse, ServerRequest } from './ClientConnection'

const HOST = process.env.NEXT_PUBLIC_HOST
const PORT = process.env.NEXT_PUBLIC_PORT

export default class GameClient {
  connection: WebSocket = new WebSocket(`ws://${HOST}:${PORT}`)
  serverRequest: ServerRequest = new ServerRequest(this.connection)
  serverResponse: ServerResponse = new ServerResponse(this.connection)

  constructor() {
    this.serverResponse.handleAll('message', new Map([
      [RESPONSE_TYPES.SERVER_PING_TIME, data => this.handleServerPing(data)],
      [RESPONSE_TYPES.SERVER_ACK_PING_TIME, data => this.handleServerAckPing(data)]
    ]))
  }
  
  isReady() {
    return this.connection.readyState === 1
  }

  private handleServerPing({ message }: ServerResponseType<PingTimes>) {
    const pingTimes = message.data
    pingTimes.clientTime = performance.now()
    this.connection.send(JSON.stringify({ type: REQUEST_TYPES.PING, data: pingTimes }))
  }

  private handleServerAckPing({ message }: ServerResponseType<PingTimes>) {
    const pingTimes = message.data
    pingTimes.clientAckTime = performance.now()
    this.connection.dispatchEvent(new CustomEvent('ping-label', { detail: pingTimes }))
  }
}