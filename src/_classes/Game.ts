import { Config } from '../_types/Config'
import { SavedWorld } from '../_types/SavedWorld'
import type GameEvents from './GameEvents'
import GameServer from './GameServer'
import GameLoop from './GameLoop'
import World from './World'

export default class Game {
  gameEvents: GameEvents
  gameServer: GameServer
  gameLoop: GameLoop
  world: World
  
  constructor(config: Config, gameEvents: GameEvents) {
    this.gameEvents = gameEvents
    this.gameServer = new GameServer(config.port, gameEvents)
    this.gameLoop = new GameLoop(config,
      () => this.update(),
      () => this.tick()
    )
  }

  start(savedWorld: SavedWorld) {
    this.world = new World(savedWorld, this.gameServer, this.gameEvents)
  }

  update() {
    this.world.update()
  }

  tick() {
    // console.log('bingo tick', this.world.characters.size)
  }
}