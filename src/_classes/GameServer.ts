import { WebSocketServer } from 'ws'
import { REQUEST_TYPES, RESPONSE_TYPES } from '../_lib/constants'
import { characters, players } from '../_lib/mock'
import { Request, RequestHandlers } from '../_types/ServerRequest'
import { SavedPlayer } from '../_types/SavedPlayer'
import { PingTimes } from '../_types/PingTImes'
import { CharacterSelection } from '../_types/CharacterSelection'
import type GameEvents from './GameEvents'
import Player from './Player'
import Character from './Character'

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
          
          this.request({ message, connection, request, requestHandlers: new Map([
            [REQUEST_TYPES.CONNECT, data => this.connect(data)],
            [REQUEST_TYPES.DISCONNECT, data => this.disconnect(data)],
            [REQUEST_TYPES.JOIN, data => this.handleJoinRequest(data)],
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

  registerMessageHandlers(requestHandlers: RequestHandlers) {
    this.server.on('connection', (connection, request) => {
      connection.on('message', data => {
        const message = JSON.parse(data.toString())
        this.request({ message, requestHandlers, connection, request })
      })
    })
  }

  request<T>({ message, requestHandlers, connection, request }: Request<T>) {
    if (!requestHandlers.size) return

    const handler = requestHandlers.get(message?.type)
    if (!handler || typeof handler !== 'function') return

    handler({ message, requestHandlers, connection, request })
  }

  connect({ message, connection }: Request<number>) {
    const pid = message.data
    if (!pid) return
    const currentPlayer = this.players.get(pid)
    if (currentPlayer) return currentPlayer.dispose()
    
    const savedPlayer = mockFetchPlayer(pid)
    const player = new Player(savedPlayer, connection)
    player.isAlive = true
    this.addPlayer(player)
    
    const availableCharacters = mockFetchAvailableCharacters(pid)
    player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.AVAILABLE_CHARACTERS, data: availableCharacters }))
  }

  disconnect({ message }: Request<CharacterSelection>) {
    console.log('bingo disconnect?')
    const { pid } = message.data
    if (!pid) return

    this.disconnectPlayer(pid)
  }

  command({ message }: Request<{ pid: number, name: string, command: string }>) {
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

  handleJoinRequest({ message }: Request<CharacterSelection>) {
    const { cid, pid } = message.data
    if (!pid || !cid) return
    
    const savedCharacter = mockFetchCharacter(cid)
    const player = this.players.get(savedCharacter.pid)
    const character = new Character(savedCharacter, player, this.gameEvents)
    this.gameEvents.emit('join', character)
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

      player.isAlive = player.connection.readyState === 1
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

  private acknowledgePing({ message }: Request<PingTimes>) {
    const pingTimes = message.data

    this.players.forEach(player => {
      if (!player.isAlive) return

      pingTimes.serverAckTime = performance.now()
      player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.SERVER_ACK_PING_TIME, data: pingTimes }))
    })
  }
}