import { EventEmitter } from "eventemitter3";
import type { Config } from "~/core/game/@types";

export class Loop {
  public events: EventEmitter = new EventEmitter();
  private cycleRate: number;
  private cyclesPerTick: number;
  private cycleSize: number;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private frameTime = 0;
  public tickCounter = 0;

  constructor(config: Config) {
    this.cycleRate = config.cycleRate; // e.g., 1 / 60 = 0.016666
    this.cycleSize = config.cycleSize;
    this.cyclesPerTick = Math.max(
      1,
      Math.round(config.tickRate / config.cycleRate),
    );
  }

  public start(): void {
    if (this.animationFrameId !== null) return;

    this.lastTime = performance.now();
    this.frameTime = 0;
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick(): void {
    this.runLoopPass();

    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  private runLoopPass(): void {
    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Spiral of Death Protection: Clamp max delta to 250ms
    if (deltaTime > 0.25) {
      deltaTime = 0.25;
    }

    this.frameTime += deltaTime;

    // Fixed timestep accumulator execution
    while (this.frameTime >= this.cycleRate) {
      // 1. Fixed 60fps logic/physics update
      this.events.emit("UPDATE", deltaTime);

      // 2. Slower fixed tick (e.g., Network synchronization)
      if (this.tickCounter % this.cyclesPerTick === 0) {
        this.events.emit("TICK", this.tickCounter);
      }

      this.frameTime -= this.cycleRate;
      this.tickCounter = (this.tickCounter + 1) % this.cycleSize;
    }
  }
}
