import type { GameConfig } from "~/shared/core/types";

export default class Loop {
  tick = 0;
  animationFrameId!: number;
  deltaTime = 0;
  onUpdate!: (deltaTime: number) => void;
  onRender!: () => void;
  onTick!: (tick: number) => void;
  private frameRate: number; // e.g., 60
  private fixedStep: number; // 🟢 The discrete time step size in seconds (e.g., 1/60 = 0.01666)
  private framesPerTick: number; // 🟢 Number of physics updates that happen before a network broadcast
  private frameSize: number; // e.g., Max tick overflow boundary
  private frameTime = 0;
  private loopTimeout: NodeJS.Timeout | null = null;
  private lastTime = 0;

  constructor(config: GameConfig) {
    this.frameRate = config.frameRate;
    this.frameSize = config.frameSize;

    // 🟢 Convert frame rate into seconds per frame
    this.fixedStep = 1 / this.frameRate;

    // 🟢 Calculate how many frames make up a single network tick
    // Example: 60 FPS / 20 Network Ticks per second = 3 frames per tick
    const framesPerTick = Math.round(this.frameRate / config.tickRate);
    this.framesPerTick = Math.max(1, framesPerTick);
  }

  public start(): void {
    if (this.loopTimeout !== null) return;

    this.lastTime = performance.now();
    this.frameTime = 0;
    this.loop();
  }

  public stop(): void {
    if (this.loopTimeout !== null) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
  }

  private loop(): void {
    this.processLoop();
    const alpha = this.frameTime / this.fixedStep;
    this.onRender();
    // Run the scheduler as fast as safely possible to pump the accumulator
    // without pegging a CPU core to 100%
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  /**
   * Core deterministic execution logic
   */
  private processLoop(): void {
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Spiral of Death Protection: Clamp max delta to 250ms
    if (this.deltaTime > 0.25) {
      this.deltaTime = 0.25;
    }

    this.frameTime += this.deltaTime;
    // 🟢 Accumulator executes updates using the calculated fixed step size
    while (this.frameTime >= this.fixedStep) {
      // 1. Fixed logic/physics update using absolute constant time step size
      this.onUpdate(this.fixedStep);

      // 2. Slower fixed tick (Network synchronization)
      if (this.tick % this.framesPerTick === 0) {
        this.onTick(this.tick);
      }

      this.frameTime -= this.fixedStep;

      // Keep ticks within your configured boundary safely
      this.tick = (this.tick + 1) % this.frameSize;
    }
  }
}
