import { Config } from "~/@types/system";
import type Game from "~/core/Game";

export default class GameLoop {
  private config: Config;
  private frameTime: number;
  private lastTime: number;
  private cyclesPerTick: number;
  private loopInterval: NodeJS.Timeout | null = null;
  tick: number;
  game: Game;

  constructor(config: Config, game: Game) {
    this.game = game;
    this.config = config;
    this.tick = 0;
    this.lastTime = 0;
    this.frameTime = 0;

    this.cyclesPerTick = Math.max(1, Math.round(this.config.tickRate / this.config.cycleRate));
  }

  start() {
    if (this.loopInterval) return;

    this.lastTime = performance.now();
    this.frameTime = 0;
    this.loopInterval = setInterval(() => this.loop(), 1000 / this.config.fps);
  }

  stop() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  private loop() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.frameTime += deltaTime;

    if (this.frameTime > 1.0) {
      this.frameTime = this.config.cycleRate;
    }

    while (this.frameTime >= this.config.cycleRate) {
      this.game.update(this.tick);

      if (this.tick % this.cyclesPerTick === 0) {
        this.game.tick(this.tick);
      }

      this.frameTime -= this.config.cycleRate;
      this.tick = (this.tick + 1) % this.config.cycleSize;
    }
  }
}