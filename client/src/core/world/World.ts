import type { IWorld, IArea } from "~/shared/types";
import type Character from "~/core/character/Character";

export default class World implements IWorld {
  public character!: Character;
  public area!: IArea;
  public queueAction(type: string, payload: any): void {
    // add action to characters pending actions
  }

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
