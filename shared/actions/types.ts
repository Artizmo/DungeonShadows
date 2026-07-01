import type { ICharacter, IWorld, IGame, ICoords } from "~/shared/types.js";

export interface IActionContext {
  character: ICharacter;
  world: IWorld;
  game: IGame;
}

export interface IAction<TPayload> {
  type: string;

  // 1. INPUT ROUTER
  getPayload(keys: Record<string, boolean>): TPayload | null;

  // 2. TIMELINE ORCHESTRATOR (Increments sequence IDs, pushes to history)
  execute(payload: TPayload, context: IActionContext): void;

  // 3. 🟢 STATE SIMULATOR (The raw math / logic slice)
  updateState(payload: TPayload, context: IActionContext): void;
  reconcile?(
    payload: ICoords,
    context: IActionContext,
    lastSequence: number,
  ): void;
}
