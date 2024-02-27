import { WebSocketServer } from 'ws'
import { REQUEST_TYPES, RESPONSE_TYPES } from '../_lib/constants'
import { characters, players } from '../_lib/mock'
import { ServerRequest } from '../_types/ServerRequest'
import { SavedPlayer } from '../_types/SavedPlayer'
import { PingTimes } from '../_types/PingTImes'
import { CharacterSelection } from '../_types/CharacterSelection'
import GameEvents from './GameEvents'
import Player from './Player'
import ServerConnection from './ServerConnection'

const mockFetchPlayer = (pid: number): SavedPlayer => players.find(player => player.id === pid)
const mockFetchCharacter = (cid: number) => characters.find(character => character.id === cid)
const mockFetchAvailableCharacters = (pid: number) => characters.filter(character => character.pid === pid)

export default class GameServer {
  private connectionPulseInterval: NodeJS.Timeout
  private connectionPingInterval: NodeJS.Timeout
  gameEvents: GameEvents
  server: WebSocketServer
  port: number
  players: Map<number, Player>
  
  constructor(port: number, gameEvents: GameEvents) {
    this.port = port
    this.players = new Map()
    this.gameEvents = gameEvents
    this.server = new WebSocketServer({ port: this.port })
      .on('connection', (connection, request) => {
        connection.on('message', data => {
          const message = JSON.parse(data.toString())
          
          ServerConnection.serverRequest({ message, connection, request, requestHandlers: new Map([
            [REQUEST_TYPES.CONNECT, data => this.connect(data)],
            [REQUEST_TYPES.DISCONNECT, data => this.disconnect(data)],
            [REQUEST_TYPES.JOIN, data => this.fetchCharacter(data)],
            [REQUEST_TYPES.PING, data => this.acknowledgePing(data)],
            [REQUEST_TYPES.COMMAND, data => this.command(data)]
          ])})
        })
      })
      .on('close', () => this.close())
    
    this.connectionPulseInterval = setInterval(() => this.checkPulse(), 250)
    this.connectionPingInterval = setInterval(() => this.checkPing(), 1000)
    
    process.on('SIGINT', () => {
      this.close()
      process.exit()
    })

    console.log(`Game server is running ${this.port}.`)
  }

  connect({ message, connection }: ServerRequest<number>) {
    const pid = message.data
    if (!pid) return

    const savedPlayer = mockFetchPlayer(pid)
    const player = new Player(savedPlayer, this.server, connection)
    player.isAlive = true
    this.addPlayer(player)
    
    const availableCharacters = mockFetchAvailableCharacters(pid)
    player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.AVAILABLE_CHARACTERS, data: availableCharacters }))
  }

  disconnect({ message }: ServerRequest<CharacterSelection>) {
    const { pid } = message.data
    if (!pid) return

    this.disconnectPlayer(pid)
  }

  command({ message }: ServerRequest<{ pid: number, name: string, command: string }>) {
    const { name, command } = message.data
    const words = command.split(' ')
    const [_, ...text] = words

    this.players.forEach(player => {
      player.connection.send(JSON.stringify({ 
        type: RESPONSE_TYPES.CHAT, 
        data: { sender: name, message: text.join(' ') }
      }))
    })
  }

  fetchCharacter({ message }: ServerRequest<CharacterSelection>) {
    const { cid, pid } = message.data
    if (!pid || !cid) return
    
    const savedCharacter = mockFetchCharacter(cid)
    this.gameEvents.emit('join', savedCharacter)

    
    const player = this.players.get(pid)
    if (!player) return

    player.connection.send(JSON.stringify({ type: REQUEST_TYPES.JOIN, data: savedCharacter }))
  }
  
  close() {
    clearInterval(this.connectionPulseInterval)
    clearInterval(this.connectionPingInterval)

    this.gameEvents.emit('abort')
  }

  disconnectPlayer(pid: number) {
    if (!pid) return 

    const player = this.players.get(pid)
    if (!player) return

    player.dispose()
    this.removePlayer(player.id)
    this.gameEvents.emit('disconnect', pid)
  }

  addPlayer(player: Player) {
    console.log('bingo add player', player.firstName)
    this.players.set(player.id, player)
  }

  removePlayer(pid: number) {
    console.log('bingo remove player', this.players.get(pid).firstName)
    this.players.delete(pid)
  }

  private checkPulse() {
    for (const player of this.players.values()) {
      const { id: pid } = player
      if (!player.isAlive) this.disconnectPlayer(pid)

      player.isAlive = false
      player.ping()
    }
  }

  private checkPing() {
    this.players.forEach(player => {
      if (!player.isAlive) return

      const pingTimes: PingTimes = { 
        serverTime: performance.now() 
      }
      player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.SERVER_PING_TIME, data: pingTimes }))
    })
  }

  private acknowledgePing({ message }: ServerRequest<PingTimes>) {
    const pingTimes = message.data

    this.players.forEach(player => {
      if (!player.isAlive) return

      pingTimes.serverAckTime = performance.now()
      player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.SERVER_ACK_PING_TIME, data: pingTimes }))
    })
  }
}