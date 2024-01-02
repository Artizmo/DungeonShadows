import * as fs from 'fs'
import GameEngine from './_classes/GameEngine'
import { ConfigType } from './_types/config'
const configPath = './config.json'

fs.readFile(configPath, (err, data) => {
  if (err) console.log(`Could not read from path: ${configPath}. Error: ${err}`)
  const config: ConfigType = JSON.parse(data.toString())
  init(config)
})

function init(config: ConfigType) {
  try {
    const game = new GameEngine(config)
    game.start()

    console.log(`Game server is running on port ${config.port}.`)
  } catch (error) {
    console.log(`Game server failed to run: ${error}`)
  }
}