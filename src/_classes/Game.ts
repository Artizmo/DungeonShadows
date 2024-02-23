import { SavedCharacter } from '@/_types/SavedCharacter'
import { PingTimes } from '@/_types/PingTimes'
import { LoopDetails } from '@/_types/LoopDetails'
import { REQUEST_TYPES, RESPONSE_TYPES } from '@/_lib/constants'
import Character from './Character'
import Renderer from './Renderer'
import GameLoop from './GameLoop'
import ClientObject from './ClientObject'
import { ServerResponse } from '@/_types/ServerResponse'

const HOST = process.env.NEXT_PUBLIC_HOST
const PORT = process.env.NEXT_PUBLIC_PORT

export default class Game {
  pid: number
  character: Character
  characters: Character[]
  connection: WebSocket
  gameLoop: GameLoop
  renderer: Renderer
  serverResponse = ClientObject.serverResponse
  responseHandlers: Map<string, (arg: any) => void>
  
  constructor() {
    this.connection = null
    this.characters = []
    this.pid = null
    this.gameLoop = new GameLoop()
    this.renderer = new Renderer()
  }

  start(pid: number) {
    this.pid = pid

    this.responseHandlers = new Map([
      [RESPONSE_TYPES.AVAILABLE_CHARACTERS, data => this.showAvailableCharacters(data)],
      [RESPONSE_TYPES.JOIN, data => this.addCharacter(data)],
      [RESPONSE_TYPES.SERVER_PING_TIME, data => this.checkPing(data)],
      [RESPONSE_TYPES.SERVER_ACK_PING_TIME, data => this.acknowledgePing(data)],
      [RESPONSE_TYPES.CHAT, data => this.chat(data)]
    ])

    this.connection = new WebSocket(`ws://${HOST}:${PORT}`)
    this.connection.onopen = () => {
      this.connection.send(JSON.stringify({ type: REQUEST_TYPES.CONNECT, data: pid }))
    }
    this.connection.onmessage = ({ data }) => {
      const message = JSON.parse(data.toString())
      const { responseHandlers } = this

      this.serverResponse({ message, responseHandlers })
    }

    this.gameLoop.start(
      () => this.input(),
      data => this.update(data),
      () => this.draw()
    )
  }

  input() {
    
  }

  update({ cycle, fps }: LoopDetails) {
    this.connection.dispatchEvent(new CustomEvent('update', { 
      detail: { 
        cycle,
        fps
      }
    }))
    
    if (this.character) this.character.setCycle(cycle)
  }

  draw() {
    this.renderer.drawRoom()
  }

  // message<T>(data: { type: string, payload: T }) {
  //   const { type, payload } = data
  //   if (type === 'join') this.addCharacter(<SavedCharacter>payload)
  //   if (type === 'character') this.updateCharacter(<Character>payload)
  //   if (type === 'available-characters') this.showAvailableCharacters(<Character[]>payload)
  //   if (type === 'server-ping-time') this.checkPing(<PingTimes>payload)
  //   if (type === 'server-ack-ping-time') this.acknowledgePing(<PingTimes>payload)
  //   if (type === 'chat') this.chat(<{ sender: string, message: string }>payload)
  // }

  join(cid: number) {
    this.connection.send(JSON.stringify({ type: REQUEST_TYPES.JOIN, data: { cid, pid: this.pid } }))
  }

  logout() {
    const { pid } = this
    const { id: cid } = this.character

    this.connection.send(JSON.stringify({ type: REQUEST_TYPES.DISCONNECT, data: { pid, cid }}))
  }

  chat({ message }: ServerResponse<{ sender: string, message: string}>) {
    const { message: text, sender } = message.data
    this.connection.dispatchEvent(new CustomEvent('chat', { 
      detail: `[Chat]: ${sender}: ${text}`
    }))
  }

  cmd(command: string) {
    if (!command) return

    const { pid } = this
    const { name } = this.character
    this.connection.send(JSON.stringify({ type: REQUEST_TYPES.COMMAND, data: { pid, name, command }}))
  }

  isReady() {
    return this.connection.readyState === 1
  }

  private checkPing({ message }: ServerResponse<PingTimes>) {
    const pingTimes = message.data
    pingTimes.clientTime = performance.now()
    this.connection.send(JSON.stringify({ type: REQUEST_TYPES.PING, data: pingTimes }))
  }

  private acknowledgePing({ message }: ServerResponse<PingTimes>) {
    const pingTimes = message.data
    pingTimes.clientAckTime = performance.now()
    this.connection.dispatchEvent(new CustomEvent('ping-label', { detail: pingTimes }))
  }

  private showAvailableCharacters({ message }: ServerResponse<Character[]>) {
    const characters = message.data
    this.connection.dispatchEvent(new CustomEvent('available-characters', { detail: characters }))
  }

  private addCharacter({ message }: ServerResponse<SavedCharacter>) {
    const savedCharacter = message.data
    this.character = new Character(savedCharacter)
    this.connection.dispatchEvent(new CustomEvent('character', { detail: this.character }))
  }
}