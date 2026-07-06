import type Character from "~/core/Character";
import type Area from "~/core/Area";

export default class World {
  public character!: Character;
  public area!: Area;

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
