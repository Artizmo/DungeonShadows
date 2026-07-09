import type { GameConfig } from "~/shared/core/types";

export default class Loop {
  tick = 0;
  animationFrameId = 0;
  deltaTime = 0;
  onUpdate!: (deltaTime: number) => void;
  onTick!: (tick: number) => void;

  private frameRate: number; // e.g., 60
  private fixedStep: number; // e.g., 1 / 60 = 0.016666 seconds (The missing piece!)
  private framesPerTick: number;
  private frameSize: number;
  private frameTime = 0;
  private lastTime = 0;

  constructor(config: GameConfig) {
    this.frameRate = config.frameRate;
    this.frameSize = config.frameSize;

    // 🟢 Convert frame rate (Hz) into a fixed duration slice in seconds
    this.fixedStep = 1 / this.frameRate;

    // Assuming TICK_RATE is something like 20 (ticks per sec) and FRAME_RATE is 60 (fps)
    // 60 / 20 = 3 frames per tick.
    const framesPerTick = Math.round(this.frameRate / config.tickRate);
    this.framesPerTick = Math.max(1, framesPerTick);
  }

  start(): void {
    if (this.animationFrameId !== 0) return;

    this.lastTime = performance.now();
    this.frameTime = 0;
    // Keep reference to the loop function arrow to preserve lexical context
    this.animationFrameId = requestAnimationFrame(() => this.processLoop());
  }

  public stop(): void {
    // 🟢 Properly cancel the animation frame
    if (this.animationFrameId !== 0) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
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

    // 🟢 Correct condition: Check against fixed step size in seconds
    while (this.frameTime >= this.fixedStep) {
      // 🟢 Pass the FIXED step size, NOT the volatile variable deltaTime!
      this.onUpdate(this.fixedStep);

      // Slower fixed tick (e.g., Network synchronization)
      if (this.tick % this.framesPerTick === 0) {
        this.onTick(this.tick);
      }

      this.frameTime -= this.fixedStep;
      this.tick = (this.tick + 1) % this.frameSize;
    }

    // 🟢 RE-REQUEST NEXT FRAME: Keeps the loop ticking continuously
    this.animationFrameId = requestAnimationFrame(() => this.processLoop());
  }
}
