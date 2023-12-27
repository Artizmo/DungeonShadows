import * as fs from 'fs'
import { Config } from './_types/system'
import GameServer from './game-server/GameServer'
const configPath = './config.json'

fs.readFile(configPath, (err, data) => {
  if (err) console.log(`Could not read from path: ${configPath}. Error: ${err}`)
  const config: Config = JSON.parse(data.toString())
  init(config)
})

function init(config: Config) {
  try {
    const game = new GameServer(config.port)
    game.run()

    console.log(`Game server is running on port ${config.port}.`)
  } catch (error) {
    console.log(`Game server failed to run: ${error}`)
  }
}