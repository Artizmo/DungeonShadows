import type Player from './Player'
import { SavedCharacter } from '../types/SavedCharacter'
import GameEvents, { GameEventListeners } from './GameEvents'

export default class Character {
  player: Player
  gameEvents: GameEvents
  eventListeners: GameEventListeners
  id: number
  name: string
  level: number
  health: {
    hp: number
    max: number
  }
  x: number
  y: number
  area: {
    id: number
  }

  constructor(savedCharacter: SavedCharacter, player: Player, gameEvents: GameEvents) {
    this.player = player
    this.gameEvents = gameEvents
    this.id = savedCharacter.id
    this.name = savedCharacter.name
    this.level = savedCharacter.level
    this.health = savedCharacter.health
    this.x = savedCharacter.x
    this.y = savedCharacter.y
    this.area = savedCharacter.area
    
    this.eventListeners = new Map([
      ['character-join', data => this.join(data)],
      ['disconnect', data => this.disconnect(data)],
      ['ACT', data => console.log('bingo char act', data)]
    ])
    
    this.gameEvents.addEventListeners(this.eventListeners)
  }

  disconnect(pid: number) {
    if (this.player.id !== pid) return

    console.log('disconnecting!!!!!!!!!!!!', this.name)
  }

  join(cid: number) {
    if (this.id !== cid) return

    console.log('JOINED', this.name)
  }

  dispose() {
    console.log('disposing')
    this.gameEvents.removeEventListeners(this.eventListeners)
  }
}