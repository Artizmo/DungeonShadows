import fs from 'fs'
import readline from 'readline'
import WebSocket from 'ws'
import jwt from 'jsonwebtoken'

const SECRET = 'pizzafriday'

const rl = readline.createInterface(process.stdin, process.stdout)
const configPath = './config.json'

const main = config => {
  const ws = new WebSocket(`ws://localhost:${config.port}`)

  ws.on('open', function open() {
    console.log('Connected.')
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
    const pid1 = 111
    const pid2 = 222
    const player1 = { id: pid1, email: 'hansolo@smugglers.org', firstName: 'Han', lastName: 'Solo' }
    const player2 = { id: pid2, email: 'luke@jedi.org', firstName: 'Luke', lastName: 'Skywalker' }
    const char1 = { id: 333, name: 'Brytagg', level: 1, maxHp: 100, hp: 100 }
    const char2 = { id: 444, name: 'Androse', level: 2, maxHp: 120, hp: 100 }
    // const token = jwt.sign(obj, SECRET)
    if (cmd === 'c1') ws.send(JSON.stringify({ type: 'connect', data: pid1 }))
    if (cmd === 'c2') ws.send(JSON.stringify({ type: 'connect', data: pid2 }))
    if (cmd === 'd2') ws.send(JSON.stringify({ type: 'disconnect', data: pid2 }))
    if (cmd === 'j1') ws.send(JSON.stringify({ type: 'join', data: { character: char1, pid: pid1 } }))
    if (cmd === 'j2') ws.send(JSON.stringify({ type: 'join', data: { character: char2, pid: pid2 } }))
    if (cmd === 'l1') ws.send(JSON.stringify({ type: 'leave', data: char1 }))
    if (cmd === 'l2') ws.send(JSON.stringify({ type: 'leave', data: char2 }))
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
