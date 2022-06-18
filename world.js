class World {
  constructor(server) {
    this.characters = [];
    this.queue = {};
    this.server = server;
    this.tick = 0;
    this.tickRate = 400;
  }

  #getTick() {
    if (this.tick === this.tickRate) {
      this.tick = 0;
      return true;
    } else {
      return false;
    }
  }

  #setTick(inc) {
    this.tick += inc;
  }

  #updateQueue() {
    for (let i=0; i < this.characters.length; i++) {
      const pid = this.characters[i].id;
      if (this.queue[pid]?.length) {
        this.queue[pid].map((q, j) => {
          if (q.tick > 1) {
            return { 
              ...q, 
              tick: q.tick--
            };
          }
          this.characters[i].connection.send(q.msg);
          this.queue[pid].splice(j, 1)
          if (!this.queue[pid].length) delete this.queue[pid];
        })
      }
    }
  }

  addCharacter(character) {
    character.server = this.server;
    this.characters.push(character);
  }

  run() {
    // game loop
    setInterval(() => {
      // tick loop
      this.#setTick(1);
      // console.log('this', this.tick, this.queue)
      if (this.#getTick()) {
        // console.log('tick!')
        this.#updateQueue();
      }
    }, 1000/50)
  }
}

export default World