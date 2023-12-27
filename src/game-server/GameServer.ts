import { WebSocketServer } from 'ws'
import { PlayerType } from '../_types/player'
import { 
  handleNewConnection,
  handleConnectionPong,
  handleHealthCheck
} from './handlers'

export default class GameServer {
  players = new Map<number, any>()
  port: number

  constructor(port: number) {
    this.players = new Map()
    this.port = port
  }

  run() {
    const { port } = this
    const server = new WebSocketServer({ port })

    server.on('connection', async (connection, req) => {
      handleNewConnection.bind(this)(connection, req)
      handleConnectionPong.bind(this)(connection)
    })

    const checkConnectionsInterval = setInterval(handleHealthCheck.bind(this), 250)

    server.on('close', () => clearInterval(checkConnectionsInterval))
  }

  addPlayer(player: PlayerType) {
    console.log('adding player')
    this.players.set(player.id, player)
  }

  removePlayer(player: PlayerType) {
    console.log('removing player', player.id)
    player.connection.terminate()
    this.players.delete(player.id)
  }
}