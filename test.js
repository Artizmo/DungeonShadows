import fs from 'fs';
import readline from 'readline';
import WebSocket from 'ws';
import chalk from 'chalk';

const rl = readline.createInterface(process.stdin, process.stdout);
const configPath = './config.json';

const main = config => {
  const ws = new WebSocket(`ws://localhost:${config.PORT}`);

  ws.on('open', function open() {
    console.log(chalk.green('Connected.'))
    rl.prompt();
  });

  ws.on('message', data => {
    console.log(data.toString());
    rl.prompt();
  });

  rl.prompt();
  rl.on('line', cmd => {
    if (cmd === 'clear') {
      console.clear();
      rl.prompt();
      return;
    }
    const obj = { name: 'Brian', age: 40 }
    if (cmd === 'test') ws.send(JSON.stringify(obj))
    else ws.send(JSON.stringify(cmd));
    rl.prompt();
  });
}

// INITIALIZE TEST CLIENTR
fs.readFile(configPath, (err, data) => {
  if (err) console.error(`Could not read from path: ${path}. Error: ${err}`)
  const config = JSON.parse(data)
  main(config)
});
