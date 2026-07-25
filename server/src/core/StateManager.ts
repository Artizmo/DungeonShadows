import Character, { CharacterDirtyFlag } from "~/core/Character";
import Npc from "./Npc";
import { FLAG_NONE, FLAG_POSITION } from "~/shared/core/constants";

export default class StateManager {
  // Returns a formatted delta object, but DOES NOT reset flags
  getDirtyState(entity: any): Record<string, any> | null {
    if (entity.dirtyFlags === FLAG_NONE) return null;

    if (entity instanceof Character) {
      return this.getCharacterDelta(entity);
    }
    if (entity instanceof Npc) {
      return this.getNpcDelta(entity);
    }

    return null;
  }

  private getCharacterDelta(character: Character): Record<string, any> {
    const delta: Record<string, any> = {
      id: character.id,
      type: "character",
    };

    if (character.dirtyFlags & CharacterDirtyFlag.POSITION) {
      delta.position = { x: character.position.x, y: character.position.y };
    }
    return delta;
  }

  private getNpcDelta(npc: Npc): Record<string, any> {
    const delta: Record<string, any> = {
      id: npc.id,
      width: npc.width,
      height: npc.height,
      type: "npc",
    };

    if (npc.dirtyFlags & FLAG_POSITION) {
      delta.position = { x: npc.position.x, y: npc.position.y };
    }
    return delta;
  }
}
