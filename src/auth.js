import Player from './player.js';

const playerFile = {
  id: 'PLAYER-234284758407534',
  contact: {
    firstName: 'Beze',
    lastName: 'Dulce',
    email: 'bezedulce@gmail.com'
  },
  characters: [
    'Brytagg'
  ],
};

class Auth {
  static authenticate(credentials, connection) {
    const { player, password = 'AD67E32F27DC673' } = credentials;
    if (player) {
      if (player === 'Brytagg') {
        const passHashFromDB = 'AD67E32F27DC673';
        if (password === passHashFromDB) {
          return { player: new Player(playerFile, connection) };
        }
        return { authError: 'Auth error: Could not authenticate.'};
      }
    }
  }
}

export default Auth