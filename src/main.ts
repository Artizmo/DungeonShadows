import * as fs from 'fs'
import { EngineConfig } from './engine/_types/engine-config'
import GameEngine from './engine/GameEngine'
const configPath = './config.json'

fs.readFile(configPath, (err, data) => {
  if (err) console.log(`Could not read from path: ${configPath}. Error: ${err}`)
  const config: EngineConfig = JSON.parse(data.toString())
  init(config)
})

function init(config: EngineConfig) {
  try {
    const game = new GameEngine(config)
    game.start()

    console.log(`Game server is running on port ${config.port}.`)
  } catch (error) {
    console.log(`Game server failed to run: ${error}`)
  }
}