import type { IUniversalMessage } from "./serializer.js";

export interface IPacketLayout {
  structure: (
    payload: any,
    sequenceId: number,
    targetId: number,
  ) => IUniversalMessage;
  destructure: (message: any) => any;
}
