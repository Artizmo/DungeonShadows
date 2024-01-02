import GameServer from './GameServer'
import GameLoop from './GameLoop'
import World from './World'
import { ConfigType } from '../_types/config'
import { CharacterType } from '../_types/character'
import Character from './Character'

export default class GameEngine {
  private loop: GameLoop
  private server: GameServer
  
  constructor(config: ConfigType) {
    this.server = new GameServer(config)
    this.loop = new GameLoop(config)
  }

  start() {
    try {
      // start up server
      this.server.start()

      // load resources

      // load world state
      const world = new World(this.server)
      
      // begin game loop
      this.loop.start(world)

    } catch(error) {
      console.log(error)
    }
  }
}