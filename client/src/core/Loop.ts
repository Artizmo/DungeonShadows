export default class Loop {
  tick: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private frameAccumulator: number = 0;
  onUpdate!: (deltaTime: number) => void;
  onTick!: (tick: number) => void;
  // Constants
  private readonly TICK_RATE_MS = 1000 / 20; // 50ms (20 ticks/sec)
  private readonly FRAME_RATE_MS = 1000 / 60; // 16.67ms (60 fps)

  constructor() {
    this.start();
  }

  start() {
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(currentTime: number) {
    // 1. Calculate delta time
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Safety: Cap deltaTime to avoid "Spiral of Death" if tab loses focus
    if (deltaTime > 250) deltaTime = 250;

    // 2. Add to accumulators
    this.accumulator += deltaTime;
    this.frameAccumulator += deltaTime;

    // 3. Process Ticks (Fixed Timestep)
    // Runs as many times as needed to catch up (20 TPS)
    while (this.accumulator >= this.TICK_RATE_MS) {
      this.tick += 1;
      this.onTick(this.tick);
      this.accumulator -= this.TICK_RATE_MS;
    }

    // 4. Process Updates (Capped at 60 FPS)
    // Only runs if enough time has passed to satisfy the 60fps requirement
    if (this.frameAccumulator >= this.FRAME_RATE_MS) {
      this.onUpdate(deltaTime);
      // Reset frame accumulator, preserving remainder to keep timing accurate
      this.frameAccumulator %= this.FRAME_RATE_MS;
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}
