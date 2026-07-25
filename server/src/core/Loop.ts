export default class ServerLoop {
  tick: number = 0;
  private lastTime: bigint = 0n;
  private accumulator: number = 0; // in milliseconds
  private isRunning: boolean = false;
  private timeoutId: NodeJS.Timeout | null = null;

  onTick!: (tick: number, deltaTime: number) => void;

  private readonly TICK_RATE_MS = 1000 / 20; // Exactly 50ms (20 ticks/sec)

  constructor() {
    this.start();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Grab high-resolution real time in nanoseconds
    this.lastTime = process.hrtime.bigint();

    // Start the recursive timeout loop
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

    // 1. Calculate delta time in milliseconds using BigInt arithmetic
    const currentTime = process.hrtime.bigint();
    // 1 millisecond = 1,000,000 nanoseconds
    let deltaTime = Number(currentTime - this.lastTime) / 1_000_000;
    this.lastTime = currentTime;

    // Safety: Cap deltaTime to avoid CPU spikes if the event loop gets bogged down
    if (deltaTime > 250) deltaTime = 250;

    // 2. Add real time passed to the tick accumulator
    this.accumulator += deltaTime;

    // 3. Process Ticks (Fixed Timestep)
    while (this.accumulator >= this.TICK_RATE_MS) {
      this.tick += 1;
      if (this.onTick) {
        this.onTick(this.tick, deltaTime);
      }
      this.accumulator -= this.TICK_RATE_MS;
    }

    // 4. Schedule the next evaluation quickly
    // Target 1ms to ensure we catch the next 50ms mark accurately
    this.timeoutId = setTimeout(() => this.tickLoop(), 1);
  }
}
