import { WebSocketServer } from 'ws'
import { ConfigType } from '../_types/config'
import { PlayerType } from '../_types/player'
import { MessageRequestType } from '../_types/message-request'
import Player from '../_classes/Player'

export default class GameServer {
  port: number
  players: Map<number, PlayerType>
  
  constructor(config: ConfigType) {
    this.port = config.port
    this.players = new Map()
  }

  // METHODS
  
  start() {
    try {
      // start server
      const server = new WebSocketServer({ port: this.port })

      // listen for connections
      server.on('connection', async (connection, request) => {
        connection.on('pong', id => {
          const playerId = JSON.parse(id.toString())
          const player = this.players.get(playerId)
          player.isAlive = true
        })

        connection.on('message', message => {
          const { type, data } = JSON.parse(message.toString())
          if (type === 'signon') this.handleSignOn(data, { connection, request })
        })
      })

      // connection healthcheck
      const checkConnectionsInterval = setInterval(() => this.handleHealthCheck(), 250)

      // stop server
      server.on('close', () => clearInterval(checkConnectionsInterval))
    } catch(error) {
      connection: WebSocket
      throw new Error(error)
    }
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

  // EVENTS HANDLERS

  handleSignOn(user: PlayerType, messageRequest: MessageRequestType ) {
    this.players.forEach(player => {
      if (player.email === user.email) return
    })

    const { connection, request } = messageRequest
    const ipAddress = request.socket.remoteAddress
    const isAlive = true 
    const id = Math.ceil(Math.random() * 1000000)
    const player = new Player({ ...user, id, isAlive, ipAddress, connection })
    this.addPlayer(player)
  }

  handleHealthCheck() {
    if (!this.players.size) return

    this.players.forEach(player => {
      if (!player.isAlive) this.removePlayer(player)
      player.connection.ping(player.id)
      player.isAlive = false
    })
  }
}