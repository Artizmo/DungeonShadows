import type { GameConfig } from "~/shared/core/types";

export default class ServerLoop {
  public tick = 0;
  public onUpdate!: (deltaTime: number) => void;
  public onTick!: (tick: number) => void;
  private frameRate: number;
  private fixedStep: number;
  private framesPerTick: number;
  private frameSize: number;
  private frameTime = 0;
  private lastTime = 0;
  private isRunning = false;
  private intervalId: any = null; // 🟢 Track the interval ID

  constructor(config: GameConfig) {
    this.frameRate = config.frameRate;
    this.frameSize = config.frameSize;
    this.fixedStep = 1 / this.frameRate;

    const framesPerTick = Math.round(this.frameRate / config.tickRate);
    this.framesPerTick = Math.max(1, framesPerTick);
  }

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.frameTime = 0;

    // 🟢 Call processLoop directly and save the interval ID
    this.intervalId = setInterval(() => this.processLoop(), 0);
  }

  public stop(): void {
    this.isRunning = false;

    // 🟢 Clean up the background timer properly
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Core deterministic execution logic (Mirrors client exactly)
   */
  private processLoop(): void {
    if (!this.isRunning) return; // Guard clause moved here

    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (deltaTime > 0.25) {
      deltaTime = 0.25;
    }

    this.frameTime += deltaTime;

    while (this.frameTime >= this.fixedStep) {
      this.onUpdate(this.fixedStep);

      if (this.tick % this.framesPerTick === 0) {
        this.onTick(this.tick);
      }

      this.frameTime -= this.fixedStep;
      this.tick = (this.tick + 1) % this.frameSize;
    }
  }
}
