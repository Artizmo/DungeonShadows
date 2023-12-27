const SERVER_TICK_RATE = 60;
const BUFFER_SIZE = 250;

export default class Game {
  constructor(server) {
    this.characters = [];
    this.currentTick = 0;
    this.currentTime = 0;
    this.deltaTime = 0;
    this.lastTime = new Date().getTime();
    this.minTimeBetweenTicks = SERVER_TICK_RATE
    this.server = server;
    this.timer = 0;
  }

  run() {
    // game loop update
    setInterval(() => {
      // frame rate loop - 60 per 1 second
      this.currentTime = new Date().getTime();
      this.deltaTime = (this.currentTime - this.lastTime) / 1000;
      this.timer += this.deltaTime;
      while (this.timer >= this.minTimeBetweenTicks) {
        // tick rate - 30 per 1 second
        this.timer -= this.minTimeBetweenTicks;
        this.tick();
        this.currentTick++;
      }
      this.lastTime = this.currentTime;
    }, 1000/60);
  }

  tick() {
    const bufferIndex = this.currentTick % BUFFER_SIZE + 1;
    console.log('process tick', bufferIndex)
  }

  addCharacter(character) {
    character.server = this.server;
    this.characters.push(character);
  }
}