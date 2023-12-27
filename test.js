import fs from 'fs'
import readline from 'readline'
import WebSocket from 'ws'
import chalk from 'chalk'
import jwt from 'jsonwebtoken'

const SECRET = 'pizzafriday'

const rl = readline.createInterface(process.stdin, process.stdout)
const configPath = './config.json'

const main = config => {
  const ws = new WebSocket(`ws://localhost:${config.port}`)

  ws.on('open', function open() {
    console.log(chalk.green('Connected.'))
    rl.prompt()
  })

  ws.on('message', data => {
    console.log(data.toString())
    rl.prompt()
  })

  rl.prompt()
  rl.on('line', cmd => {
    if (cmd === 'clear') {
      console.clear()
      rl.prompt()
      return
    }
    // test auth
    const id = Math.ceil(Math.random() * 1000000)
    const obj = { id, email: 'hansolo@smugglers.org', firstName: 'Han', lastName: 'Solo' }
    const token = jwt.sign(obj, SECRET)
    if (cmd === 'auth') ws.send(JSON.stringify({ type: 'signon', data: token }))
    else ws.send(JSON.stringify(cmd))
    rl.prompt()
  })
}

// INITIALIZE TEST CLIENT
fs.readFile(configPath, (err, data) => {
  if (err) console.error(`Could not read from path: ${path}. Error: ${err}`)
  const config = JSON.parse(data)
  main(config)
})
