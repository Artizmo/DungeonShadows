
class Character {
  constructor(charFile, connection) {
    this.id = charFile.id ?? `CHAR-${uuidv4()}`;
    this.name = charFile.name ?? 'Newbie Character';
    this.level = charFile.level ?? 1;
    this.hp = charFile.hp ?? 200;
    this.stamina = charFile.stamina ?? 200;
    this.server = null;
    this.connection = connection;
    this.connection.on('message', rawMessage => {
      const msg = typeof rawMessage === 'object' ? rawMessage.toString() : JSON.parse(rawMessage)
      console.log(`Server update. ${this.name} sent ${msg}`);
      connection.send(`This is coming from the server. You sent ${msg}`);
    })
  }
}

export default Character;