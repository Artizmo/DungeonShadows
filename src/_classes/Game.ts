import { Config } from '../_types/Config'
import { SavedWorld } from '../_types/SavedWorld'
import GameServer from './GameServer'
import GameLoop from './GameLoop'
import GameEvents from './GameEvents'
import World from './World'
import areas from '../areas/list'

export default class Game extends GameServer {
  private gameLoop: GameLoop
  world: World
  
  constructor(config: Config, gameEvents: GameEvents) {
    super(config.port, gameEvents)
    this.gameLoop = new GameLoop(config, () => this.update(), () => this.tick())
  }

  start(savedWorld: SavedWorld) {
    this.gameLoop.start()
    this.world = new World(areas, savedWorld, this.server, this.gameEvents)
  }

  update() {
    
  }

  tick() {
    console.log('bingo tick', this.world.characters.size, this.gameEvents.emitter.listenerCount('disconnect'))
  }
}