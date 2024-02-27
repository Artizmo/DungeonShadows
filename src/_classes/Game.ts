import { SavedCharacter } from '@/_types/SavedCharacter'
import { LoopDetails } from '@/_types/LoopDetails'
import { ServerResponseType } from '@/_types/ServerResponse'
import { REQUEST_TYPES, RESPONSE_TYPES } from '@/_lib/constants'
import GameClient from './GameClient'
import Character from './Character'
import Renderer from './Renderer'
import GameLoop from './GameLoop'
import { ServerRequest, ServerResponse } from './ClientConnection'

export default class Game extends GameClient {
  serverRequest: ServerRequest
  serverResponse: ServerResponse
  gameLoop: GameLoop
  renderer: Renderer
  character: Character
  characters: Character[]
  pid: number
  
  constructor(pid: number) {
    super()
    this.pid = pid
    this.characters = []
    this.gameLoop = new GameLoop()
    this.renderer = new Renderer()
    this.serverResponse = new ServerResponse(this.connection)
  }

  start() {
    this.serverResponse.handle('open', () => {
      this.serverRequest.send(REQUEST_TYPES.CONNECT, this.pid)
    })

    this.serverResponse.handleAll('message', new Map([
      [RESPONSE_TYPES.AVAILABLE_CHARACTERS, data => this.handleAvailableCharacters(data)],
      [RESPONSE_TYPES.JOIN, data => this.handleJoin(data)],
      [RESPONSE_TYPES.CHAT, data => this.handleChat(data)]
    ]))

    this.gameLoop.start(
      () => this.input(),
      data => this.update(data),
      () => this.draw()
    )
  }

  private input() {
    
  }

  private update({ cycle, fps }: LoopDetails) {
    this.connection.dispatchEvent(new CustomEvent('update', { 
      detail: { 
        cycle,
        fps,
        character: this.character
      }
    }))
    
    if (this.character) {
      this.character.setCycle(cycle)
      this.character.update()
    }
  }

  private draw() {
    if (this.character) this.character.draw()
  }

  join(cid: number) {
    this.serverRequest.send(REQUEST_TYPES.JOIN, { cid, pid: this.pid })
  }

  logout() {
    this.connection.send(JSON.stringify({ type: REQUEST_TYPES.DISCONNECT, data: { 
      pid: this.pid,
      cid: this.character.id
    }}))
  }

  command(command: string) {
    if (!command) return
    
    const { pid } = this
    const { name } = this.character
    this.connection.send(JSON.stringify({ type: REQUEST_TYPES.COMMAND, data: { pid, name, command }}))
  }
  
  private handleChat({ message }: ServerResponseType<{ sender: string, message: string}>) {
    const { message: text, sender } = message.data
    this.connection.dispatchEvent(new CustomEvent('chat', { 
      detail: `[Chat]: ${sender}: ${text}`
    }))
  }

  private handleAvailableCharacters({ message }: ServerResponseType<Character[]>) {
    const characters = message.data
    this.connection.dispatchEvent(new CustomEvent('available-characters', { detail: characters }))
  }

  private handleJoin({ message }: ServerResponseType<SavedCharacter>) {
    const savedCharacter = message.data
    this.character = new Character(savedCharacter, this.renderer)
    this.character.isJoined = true
    this.connection.dispatchEvent(new CustomEvent('character', { detail: this.character }))
  }
}