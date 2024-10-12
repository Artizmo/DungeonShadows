import * as fs from 'fs'
import { Config } from './_types/Config'
import Game from './_classes/Game'
import GameEvents from './_classes/GameEvents'
import savedWorld from './savedWorld/world'

const configPath = './config.json'

fs.readFile(configPath, (err, data) => {
  if (err) console.log(`Could not read from path: ${configPath}. Error: ${err}`)
  const config: Config = JSON.parse(data.toString())
  init(config)
})

function init(config: Config) {
  try {
    const gameEvents = new GameEvents()
    const game = new Game(config, gameEvents)
    game.start(savedWorld)

  } catch (error) {
    console.log(`Game failed to run: ${error}`)
  }
}