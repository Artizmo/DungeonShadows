import type { Config } from "~/shared/core/types";

export default class cycle {
  tick = 0;
  deltaTime = 0;
  _onUpdate!: (deltaTime: number) => void;
  _onTick!: (tick: number) => void;
  private cycleRate: number;
  private cyclesPerTick: number;
  private cycleSize: number;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private frameTime = 0;

  constructor(config: Config) {
    this.cycleRate = config.cycleRate;
    this.cycleSize = config.cycleSize;
    this.cyclesPerTick = Math.max(
      1,
      Math.round(config.tickRate / config.cycleRate),
    );
  }

  set onUpdate(callback: (deltaTime: number) => void) {
    this._onUpdate = callback;
  }

  set onTick(callback: (tick: number) => void) {
    this._onTick = callback;
  }

  public start(): void {
    if (this.animationFrameId !== null) return;

    this.lastTime = performance.now();
    this.frameTime = 0;
    this.animationFrameId = requestAnimationFrame(() => this.processCycle());
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private processCycle(): void {
    this.cycle();

    this.animationFrameId = requestAnimationFrame(() => this.processCycle());
  }

  private cycle(): void {
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Spiral of Death Protection: Clamp max delta to 250ms
    if (this.deltaTime > 0.25) {
      this.deltaTime = 0.25;
    }

    this.frameTime += this.deltaTime;

    // Fixed timestep accumulator execution
    while (this.frameTime >= this.cycleRate) {
      // 1. Fixed 60fps logic/physics update
      this._onUpdate(this.deltaTime);

      // 2. Slower fixed tick (e.g., Network synchronization)
      if (this.tick % this.cyclesPerTick === 0) {
        this._onTick(this.tick);
      }

      this.frameTime -= this.cycleRate;
      this.tick = (this.tick + 1) % this.cycleSize;
    }
  }
}
