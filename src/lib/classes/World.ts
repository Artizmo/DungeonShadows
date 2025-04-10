import { Area, Character, SavedWorld } from "../types/world";
import { GameEvents } from "../types/game";
import GameServer from "./GameServer";

export default class World {
  gameEvents: GameEvents;
  gameServer: GameServer;
  name: string;
  characters: Map<number, Character>;
  areas: Map<number, Area>;

  constructor(savedWorld: SavedWorld, gameServer: GameServer, gameEvents: GameEvents) {
    this.gameEvents = gameEvents;
    this.gameServer = gameServer;
    this.name = savedWorld.name;
    this.characters = new Map();
  }

  update() {
    console.log('bingo world update')
  }
}

// import { open } from 'node:fs/promises'
// import { WebSocket } from 'ws'
// import type GameServer from './GameServer'
// import { Request, RequestHandlers } from '../types/ServerRequest'
// // import { SavedWorld } from '../types/SavedWorld'
// import GameEvents, { GameEventListeners } from './GameEvents'
// // import { REQUEST_TYPES, RESPONSE_TYPES } from '../lib/constants'
// import Character from './Character'
// import Area from './Area'

// type InputType = {
//   key: string
//   type: string
//   input: any
// }

// export default class World {
//   name: string
//   gameServer: GameServer
//   gameEvents: GameEvents
//   eventListeners: GameEventListeners
//   requestHandlers: RequestHandlers
//   characters: Map<number, Character>
//   areas: Map<number, Area>

//   constructor( savedWorld: SavedWorld, gameServer: GameServer, gameEvents: GameEvents) {
//     this.gameEvents = gameEvents
//     this.gameServer = gameServer
//     this.name = savedWorld.name
//     this.characters = new Map()
//     this.areas = savedWorld.areas
//     this.eventListeners = new Map([
//       ['join', data => this.handleJoinEvent(data)],
//       ['disconnect', data => this.handleDisconnectEvent(data)],
//       ['abort', () => this.handleAbortEvent()]
//     ])
//     this.requestHandlers = new Map([
//       [REQUEST_TYPES.INPUT, data => this.handleInputRequest(data)]
//     ])

//     this.gameEvents.addEventListeners(this.eventListeners)
//     // this.gameServer.registerMessageHandlers(this.requestHandlers)
//   }

//   update() {
//     for (const area of this.areas.values()) {
//       area.update(this.areas, this.gameServer, this.gameEvents)
//     }
//     // for (const character of this.characters.values()) {
//     //   console.log('bingo', character.player.connection.readyState)
//     //   if (character.player.connection.readyState === WebSocket.CLOSED) return
//     //   const { id } = character.area
//     //   const area = this.areas.get(id)


//     //   character.player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.CHARACTER, data: character }))
//     //   character.player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.AREA, data: area }))
//     // }
//   }

//   addCharacter(character: Character) {
//     console.log('adding char', character.id)
//     this.characters.set(character.id, character)
//   }

//   removeCharacter(cid: number) {
//     console.log('removing character id', cid)
//     this.characters.delete(cid)
//   }

//   addCharacterToZone(character: Character, zone) {

//   }

//   save() {
//     console.log('\nsaving world state...')
//     this.characters.forEach(character => {
//       console.log('saving player and character states...', character.name)
//     })
//   }
  
//   private handleInputRequest({ message }: Request<InputType>) {
//     const { key, input } = message.data
//     console.log('bingo input', key, input)
//   }

//   private async handleJoinEvent(character: Character) {
//     if (!character) return

//     this.addCharacter(character)
//     character.player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.CHARACTER, data: character }))

//     const area = this.areas.get(character.area.id)
//     const mapFilePath = `src/savedWorld/${area.zones.get(1000).mapSrc}.webp`

//     const mapFile = await open(mapFilePath)
//     const mapStream = mapFile.createReadStream({ encoding: 'binary', autoClose: true, highWaterMark: 5024 * 5024 })
//     mapStream.on('data', (chunk: Buffer) => {
//       character.player.connection.send(JSON.stringify({ type: 'MAP', data: chunk }))
//     })
//   }

//   private handleDisconnectEvent(pid: number) {
//     if (!pid) return

//     for (const character of this.characters.values()) {
//       if (character.player.id === pid) {
//         character.dispose()
//         this.removeCharacter(character.id)
//       }
//     }
//   }

//   private handleAbortEvent() {
//     this.shutdown()
//   }

//   private shutdown() {
//     this.save()
//     this.gameEvents.removeEventListeners(this.eventListeners)
//   }
// }