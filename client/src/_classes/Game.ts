import { SavedCharacter } from '@/_types/SavedCharacter'
import { LoopDetails } from '@/_types/LoopDetails'
import { ServerResponseType } from '@/_types/ServerResponse'
import { REQUEST_TYPES, RESPONSE_TYPES } from '@/_lib/constants'
import GameClient from './GameClient'
import Character from './Character'
import Renderer from './Renderer'
import GameLoop from './GameLoop'
import { ServerResponse } from './ClientConnection'

export default class Game extends GameClient {
  gameLoop: GameLoop
  renderer: Renderer
  character: Character
  characters: Character[]
  area: any
  pid: number
  chunks: Buffer[] = []
  
  constructor(pid: number) {
    super()
    this.pid = pid
    this.character = null
    this.area = null
    this.characters = []
    this.gameLoop = new GameLoop()
    this.renderer = new Renderer()
    this.serverResponse = new ServerResponse(this.connection)
  }

  start() {
    console.log('bingo starting')
    this.serverResponse.handle('open', () => {
      console.log('bingo pid', this.pid)
      this.serverRequest.send(REQUEST_TYPES.CONNECT, this.pid)
    })

    this.serverResponse.handleAll('message', new Map([
      [RESPONSE_TYPES.AVAILABLE_CHARACTERS, data => this.handleAvailableCharacters(data)],
      [RESPONSE_TYPES.CHARACTER, data => this.handleJoin(data)],
      [RESPONSE_TYPES.AREA, data => this.handleArea(data)],
      [RESPONSE_TYPES.CHAT, data => this.handleChat(data)],
      ['MAP', data => this.handleMap(data)]
    ]))

    // this.connection.addEventListener('message', (event: MessageEvent) => {
    //   try {
    //     const message = JSON.parse(event.data.toString())
    //     if (message?.type !== 'MAP') return
        
    //     console.log('bingo event', btoa(message.data))

    //     // if (message.type === 'MAP') {
    //     // }
    //     // const { data } = event
    //     // const message = JSON.parse(data.toString())
    //     // if (message?.type === 'MAP') this.handleMap(data)
    //   } catch {
    //     // console.log('bingo event', btoa(event.data))
    //   }
    // })

    this.gameLoop.start(
      () => this.input(),
      data => this.update(data),
      () => this.draw()
    )
  }
  
  private async input() {
    if (!this.character) return
    const { queue } = this.character
    const queueSize = queue.size
    if (!queueSize) return
  
    // const { cycle } = this.gameLoop
    for (const [key, input] of queue.entries()){
      this.connection.send(
        JSON.stringify({ 
          type: REQUEST_TYPES.INPUT, 
          data: { key, cid: this.character.id, input } 
        })
      )
      this.character.queue.delete(key)
    }
    console.timeEnd('test')
  }

  private update({ cycle, fps }: LoopDetails) {
    if (this.character) {
      this.character.update({ cycle })
    }

    this.connection.dispatchEvent(new CustomEvent('update', { 
      detail: { 
        cycle,
        fps,
        character: this.character
      }
    }))
    
  }

  private draw() {
    if (this.character) this.character.draw()
  }

  private handleJoin({ message }: ServerResponseType<SavedCharacter>) {
    const savedCharacter = message.data

    this.character = new Character(savedCharacter, this.connection, this.renderer)
    this.character.isJoined = true
    this.connection.dispatchEvent(new CustomEvent('character', { detail: this.character }))
  }
  
  private handleMap({ message }: ServerResponseType<string>) {
    const chunk = message.data
    // this.chunks.push(chunk)

    this.connection.dispatchEvent(new CustomEvent('map', { 
      detail: chunk
    }))
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

  private handleArea({ message }: ServerResponseType<any>) {
    const area = message.data
    this.area = area
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
}