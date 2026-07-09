import type { GameEntity } from "~/shared/core/types";
import type Game from "../Game";

export interface ActionHandler {
  validate?(
    payload: { characterId: number; playerId?: number },
    game: Game,
    dt?: number,
    entity?: GameEntity,
  ): boolean;
  execute(
    payload: { characterId: number; playerId?: number },
    game: Game,
    dt?: number,
    entity?: GameEntity,
  ): void;
  update?(
    payload: { characterId: number; playerId?: number },
    game: Game,
    dt?: number,
    entity?: GameEntity,
  ): void;
  reconcile?(
    payload: { characterId: number; playerId?: number },
    game: Game,
    dt?: number,
    entity?: GameEntity,
  ): void;
}
