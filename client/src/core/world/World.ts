import type Area from "./Area";
import type Character from "~/core/character/Character";

export class World {
  public character!: Character;
  public area!: Area;
  public queueAction(type: string, payload: any): void {
    // add action to characters pending actions
  }

  public reconcile(): void {}

  public update(tick: number): void {
    // 🎯 Move the render call here so it updates fluidly every single frame
    // this.game.renderer?.render();
  }

  public tick(tick: number): void {
    // Leave this clear or restricted purely to fixed physics step network checks
    // this.game.character?.tick();
    if (this.character) {
      this.character.tick(tick);
    }
  }

  public clear(): void {}
}
