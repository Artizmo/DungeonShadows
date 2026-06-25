import { Config } from "~/core/game/@types";
import type Game from "~/core/game/Game";

export default class GameLoop {
  private config: Config;
  private cycleRate: number;
  private cyclesPerTick: number;
  private cycleSize: number;

  private loopTimeout: NodeJS.Timeout | null = null;
  private lastTime = 0;
  private frameTime = 0;

  public tickCounter = 0;
  private game: Game;

  constructor(config: Config, game: Game) {
    this.game = game;
    this.config = config;
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
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Spiral of Death Protection: Clamp max delta to 250ms (prevents freezing catch-up cascades)
    if (deltaTime > 0.25) {
      deltaTime = 0.25;
    }

    this.frameTime += deltaTime;

    // Fixed timestep accumulator execution
    while (this.frameTime >= this.cycleRate) {
      // 1. Fixed 60fps logic/physics update
      this.game.update(this.tickCounter);

      // 2. Slower fixed tick (e.g., Network synchronization)
      if (this.tickCounter % this.cyclesPerTick === 0) {
        this.game.tick(this.tickCounter);
      }

      this.frameTime -= this.cycleRate;
      this.tickCounter = (this.tickCounter + 1) % this.cycleSize;
    }
  }
}
