import type { IGame } from "~/shared/core/types.js";

// A flat structure matching our deserialized array items
export interface IDecodedMessage {
  type: number;
  sequenceId: number;
  targetId: number;
  ints: number[];
  floats: number[];
  strings: string[];
  bytes: Uint8Array | null;
}

export type ActionHandler = (msg: IDecodedMessage, game: IGame) => void;
