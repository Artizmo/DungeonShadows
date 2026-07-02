import { GameProtocol } from "~/shared/network/generated/index.js";
import type Character from "~/core/Character";
import type Game from "~/core/Game";

export interface IMoveAction {
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
  deltaTime: number;
}

export interface IMapChunkAction {
  x: number;
  y: number;
  imageBytes: Uint8Array;
}

export interface IPendingAction<T = any> {
  type: GameProtocol.ActionType;
  sequenceId: number;
  payload: T;
}

export interface IActionContext {
  character: Character; // 🟢 Directly matches your true ICharacter model type
  game: Game; // 🟢 Directly matches your true IGame model type
}

// Loose structure used specifically to build the ActionRegistry collection type signature
export interface ActionHandler {
  getPayload?(keys: Record<string, boolean>, deltaTime: number): any;
  execute(payload: any, context: IActionContext): void;
  updateState?(payload: any, context: IActionContext): void;
  reconcile?(payload: any, context: IActionContext, lastSequence: number): void;
}
