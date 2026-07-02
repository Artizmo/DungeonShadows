// [ ] clean this up and delete if possible
import type { GameProtocol } from "~/shared/network/generated/index.js";

export enum GameEventType {
  DAMAGE = "DAMAGE",
  ADD_EFFECT = "ADD_EFFECT",
  REMOVE_EFFECT = "REMOVE_EFFECT",
  DEATH = "DEATH",
  CHARACTER = "CHARACTER",
  MOVE = "MOVE",
}

export type MoveEvent = {
  type: GameEventType.MOVE;
  characterId: number;
  x: number;
  y: number;
  lastProcessedId: number;
};

export interface IPendingAction<T = any> {
  type: GameProtocol.ActionType;
  sequenceId: number;
  payload: T;
}
