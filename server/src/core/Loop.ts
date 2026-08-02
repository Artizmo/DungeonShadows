export default class Loop {
  tick: number = 0;
  onTick!: (tick: number, tickRate: number) => void;
  private lastTime: bigint = 0n;
  private accumulator: number = 0; // in seconds
  private isRunning: boolean = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly TICK_RATE_SEC = 0.05;

  constructor() {
    this.start();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = process.hrtime.bigint();
    this.tickLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private tickLoop() {
    if (!this.isRunning) return;

    // 1. Calculate real delta time in SECONDS
    const currentTime = process.hrtime.bigint();
    // 1 second = 1,000,000,000 nanoseconds
    let frameTime = Number(currentTime - this.lastTime) / 1_000_000_000;
    this.lastTime = currentTime;

    // Safety spiral-of-death cap (e.g. max 0.25 seconds)
    if (frameTime > 0.25) frameTime = 0.25;

    // 2. Add real time passed (in seconds) to accumulator
    this.accumulator += frameTime;

    // 3. Process Ticks using the fixed timestep delta (0.05s)
    while (this.accumulator >= this.TICK_RATE_SEC) {
      this.tick += 1;
      if (this.onTick) {
        // 🟢 Pass the fixed step size in SECONDS (0.05), NOT the raw variable frame time
        this.onTick(this.tick, this.TICK_RATE_SEC);
      }
      this.accumulator -= this.TICK_RATE_SEC;
    }

    // 4. Schedule next iteration
    this.timeoutId = setTimeout(() => this.tickLoop(), 1);
  }
}
