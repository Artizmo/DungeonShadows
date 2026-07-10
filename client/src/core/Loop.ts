export default class Loop {
  tick: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;

  onUpdate!: (deltaTime: number, alpha: number) => void;
  onTick!: (tick: number) => void;

  private readonly TICK_RATE_MS = 1000 / 20; // Exactly 50ms (20 ticks/sec)

  constructor() {
    this.start();
  }

  start() {
    // Request animation frame passes a high-res timestamp automatically
    requestAnimationFrame((time) => {
      this.lastTime = time;
      requestAnimationFrame(this.loop.bind(this));
    });
  }

  private loop(currentTime: number) {
    // 1. Calculate delta time (how long it took since the last display frame)
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Safety: Cap deltaTime to avoid "Spiral of Death" if tab loses focus
    if (deltaTime > 250) deltaTime = 250;

    // 2. Add real time passed to the tick accumulator
    this.accumulator += deltaTime;

    // 3. Process Ticks (Fixed Timestep)
    // Runs exactly enough times to catch up the simulation state to real-world time
    while (this.accumulator >= this.TICK_RATE_MS) {
      this.tick += 1;
      this.onTick(this.tick);
      this.accumulator -= this.TICK_RATE_MS;
    }

    // Calculate how far we are into the NEXT tick (from 0.0 to 1.0)
    const alpha = this.accumulator / this.TICK_RATE_MS;

    // 4. Process Visuals (Variable Timestep)
    // This runs EVERY single frame at the native refresh rate of the monitor (60Hz, 144Hz, etc.)
    // It updates LERP visual positions and renders the canvas.
    if (this.onUpdate) {
      this.onUpdate(deltaTime, alpha);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}
