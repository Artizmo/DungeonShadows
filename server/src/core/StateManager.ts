import Character, { CharacterDirtyFlag } from "~/core/Character";
import type { WorldState } from "~/shared/core/types";

export default class StateManager {
  getDirtyState(entity: any): Record<string, any> | null {
    if (entity.dirtyFlags === 0) return null;

    let state: Record<string, any> | null = null;
    let flags: CharacterDirtyFlag;

    if (entity instanceof Character) {
      state = this.getCharacterDelta(entity);
      flags = entity.dirtyFlags;
      entity.dirtyFlags = CharacterDirtyFlag.NONE;
    }

    return {
      state,
      flags,
    };
  }
  private getCharacterDelta(character: Character): WorldState {
    let delta: WorldState = {};
    const flags = character.dirtyFlags;

    if (flags & CharacterDirtyFlag.POSITION) {
      const {
        position: { x, y },
      } = character;

      delta = {
        character: { position: { x, y } },
      };
    }

    return delta;
  }
}
