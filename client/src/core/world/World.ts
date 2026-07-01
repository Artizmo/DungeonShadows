import type { IWorld, IArea } from "~/shared/types";
import type Character from "~/core/character/Character";

export default class World implements IWorld {
  public character!: Character;
  public area!: IArea;
  public queueAction(type: string, payload: any): void {
    // add action to characters pending actions
  }

  public update(deltaTime: number): void {}

  public tick(tick: number): void {
    if (!this.character) return;
    if (!this.area) return;

    this.character.tick(tick);
    this.area.tick(tick);
  }

  public clear(): void {}
}
