import { EventEmitter } from "events";
import { Config } from "~/core/types";

export default class GameLoop {
  tickCounter = 0;
  events: EventEmitter = new EventEmitter();
  deltaTime: number;
  private cycleRate: number;
  private cyclesPerTick: number;
  private cycleSize: number;
  private loopTimeout: NodeJS.Timeout | null = null;
  private lastTime = 0;
  private frameTime = 0;

  constructor(config: Config) {
    this.cycleRate = config.cycleRate; // e.g., 1 / 60 = 0.016666
    this.cycleSize = config.cycleSize;

    this.cyclesPerTick = Math.max(
      1,
      Math.round(config.tickRate / config.cycleRate),
    );
  }

  public start(): void {
    if (this.loopTimeout !== null) return;

    this.lastTime = performance.now();
    this.frameTime = 0;
    this.tick();
  }

  public stop(): void {
    if (this.loopTimeout !== null) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
  }

  private tick(): void {
    this.runLoopPass();

    // Run the scheduler as fast as safely possible to pump the accumulator
    // without pegging a CPU core to 100%
    this.loopTimeout = setTimeout(() => this.tick(), 4);
  }

  /**
   * Core deterministic execution logic
   */
  private runLoopPass(): void {
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Spiral of Death Protection: Clamp max delta to 250ms (prevents freezing catch-up cascades)
    if (this.deltaTime > 0.25) {
      this.deltaTime = 0.25;
    }

    this.frameTime += this.deltaTime;

    // Fixed timestep accumulator execution
    while (this.frameTime >= this.cycleRate) {
      // 1. Fixed 60fps logic/physics update
      this.events.emit("UPDATE", this.deltaTime);

      // 2. Slower fixed tick (e.g., Network synchronization)
      if (this.tickCounter % this.cyclesPerTick === 0) {
        this.events.emit("TICK", this.tickCounter);
      }

      this.frameTime -= this.cycleRate;
      this.tickCounter = (this.tickCounter + 1) % this.cycleSize;
    }
  }
}
