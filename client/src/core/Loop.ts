export default class Loop {
  tick: number = 0;
  tickRate: number = 0;
  onUpdate!: (alpha: number) => void;
  onTick!: (tick: number) => void;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly TICK_RATE_MS = 1000 / 20; // Exactly 50ms (20 ticks/sec)

  constructor() {
    this.tickRate = this.TICK_RATE_MS / 1000; // Tick rate in seconds
    this.start();
  }

  start() {
    requestAnimationFrame((time) => {
      this.lastTime = time;
      requestAnimationFrame(this.loop);
    });
  }

  private loop = (currentTime: number) => {
    // 1. Calculate delta time
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Safety: Cap deltaTime to avoid "Spiral of Death" if tab loses focus
    if (deltaTime > 250) deltaTime = 250;

    // 2. Add real time passed to the tick accumulator
    this.accumulator += deltaTime;

    // 3. Process Ticks (Fixed Timestep)
    while (this.accumulator >= this.TICK_RATE_MS) {
      this.tick += 1;
      this.onTick?.(this.tick); // Safe execution check
      this.accumulator -= this.TICK_RATE_MS;
    }

    // Calculate how far we are into the NEXT tick (from 0.0 to 1.0)
    const alpha = this.accumulator / this.TICK_RATE_MS;

    // 4. Process Visuals (Variable Timestep)
    this.onUpdate?.(alpha);

    // Queue up the next frame cleanly using the cached function pointer
    requestAnimationFrame(this.loop);
  };
}
