import type { IWorld, IArea } from "~/shared/core/types";
import type Character from "~/core/Character";
import { c } from "node_modules/vite/dist/node/moduleRunnerTransport.d-DJ_mE5sf";

export default class World implements IWorld {
  public character!: Character;
  public area!: IArea;

  public join(character: Character): void {
    if (!character) return;

    this.character = character;
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
