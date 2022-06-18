import fs from 'fs';
import { WebSocketServer } from 'ws';

import Auth from './auth.js';
import World from './world.js';

const configPath = './config.json';

const main = config => {
  // start game server
  const server = new WebSocketServer({ port: config.PORT });
  console.log(`Server listing on port ${config.PORT}.`);
  
  // run world
  const world = new World(server);
  world.run();

  // listen for connections
  server.on('connection', async connection => {
    // get auth player
    const { player, authError } = Auth.authenticate({ player: 'Brytagg' }, connection);
    if (authError) return;
    if (player) {
      // load player characters from file
      const characters = await player.load();
      // select character from list
      const charFile = characters[0];
      // create character
      const Brytagg = player.loadCharacter(charFile);
      // add player to world
      world.addCharacter(Brytagg);
    }
  });
}

// INITIALIZE GAME SERVER
fs.readFile(configPath, (err, data) => {
  if (err) console.error(`Could not read from path: ${path}. Error: ${err}`)
  const config = JSON.parse(data)
  main(config)
});
