import jwt from 'jsonwebtoken'
import { WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import Player from '../player/Player'
import { PlayerType } from '../_types/player'

export function handleNewConnection(connection: WebSocket, req: IncomingMessage) {
  console.log('handling connection', this)
  connection.on('message', message => {
    const { type, data } = JSON.parse(message.toString())
    if (type === 'signon') {
      const ipAddress = req.socket.remoteAddress
      const isAlive = true
      const user = jwt.verify(data, 'pizzafriday')
      if (!user) return
      
      const player = new Player(user, connection, data, ipAddress, isAlive)
      this.addPlayer(player)
    }
  })
}

export function handleConnectionPong(connection: WebSocket) {
  connection.on('pong', id => {
    const playerId = JSON.parse(id.toString())
    const player: PlayerType = this.players.get(playerId)
    player.isAlive = true

    console.log('pong', this.players.get(playerId).isAlive)
  })
}

export function handleHealthCheck() {
  if (!this.players.size) return

  this.players.forEach((player: PlayerType) => {
    if (!player.isAlive) this.removePlayer(player)
    console.log('ping', player.id)
    player.connection.ping(player.id)
    player.isAlive = false
  })
}