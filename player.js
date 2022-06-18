import fs from 'fs';

import Character from './character.js';

const charPath = './characters.json';

class Player {
  constructor(playerFile, connection) {
    this.connection = connection;
    this.contact = {
      firstName: playerFile.contact.firstName ?? '',
      lastName: playerFile.contact.lastName ?? '',
      email: playerFile.contact.email ?? ''
    };
    this.id = playerFile.id ?? null;
    this.currentCharacter = null;
    this.characters = playerFile.characters ?? [];
    this.connection.on('message', rawMessage => {
      const msg = typeof rawMessage === 'object' ? rawMessage.toString() : rawMessage;
    })
    this.load();
  }

  async load() {
    return new Promise((resolve, reject) => {
      fs.readFile(charPath, (error, data) => {
        if (error) {
          console.error(`Could not read from path: ${charPath}. Error: ${error}`);
          reject(error);
        }
        const characters = JSON.parse(data);
        resolve(characters);
      });
    });
  }

  loadCharacter(charFile) {
    const character = new Character(charFile, this.connection);
    this.currentCharacter = character;
    return character;
  }

  setContact(contact) {
    const { firstName, lastName, email } = contact
    this.contact = {
      firstName,
      lastName,
      email
    }
  }
}

export default Player;