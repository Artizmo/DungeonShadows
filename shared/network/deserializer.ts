import * as flatbuffers from "flatbuffers";
import { GameProtocol } from "~/shared/network/generated/index.js";
import type { IUniversalMessage } from "./serializer.js";

export interface IDecodedPacket {
  messages: IUniversalMessage[];
}

export class Deserialize {
  public static packet(binaryData: Uint8Array): IDecodedPacket {
    const buf = new flatbuffers.ByteBuffer(binaryData);
    const packet = GameProtocol.GamePacket.getRootAsGamePacket(buf);
    const decodedMessages: IDecodedPacket["messages"] = [];
    const len = packet.messagesLength();

    for (let i = 0; i < len; i++) {
      const envelope = packet.messages(i);
      if (!envelope) continue;

      // Unpack Ints Vector
      const ints: number[] = [];
      const intsLen = envelope.intsLength();
      for (let j = 0; j < intsLen; j++) {
        ints.push(envelope.ints(j)!);
      }

      // Unpack Floats Vector
      const floats: number[] = [];
      const floatsLen = envelope.floatsLength();
      for (let j = 0; j < floatsLen; j++) {
        floats.push(envelope.floats(j)!);
      }

      // Unpack Strings Vector
      const strings: string[] = [];
      const stringsLen = envelope.stringsLength();
      for (let j = 0; j < stringsLen; j++) {
        strings.push(envelope.strings(j)!);
      }

      // Unpack Raw Bytes Vector (Zero-copy optimization method via FlatBuffers)
      const bytes = envelope.bytesArray();

      decodedMessages.push({
        type: envelope.type(),
        actionType: envelope.actionType(),
        tick: Number(envelope.tick()),
        lastProcessedId: Number(envelope.lastProcessedId()),
        sequenceId: Number(envelope.sequenceId()),
        targetId: envelope.targetId(),
        ints,
        floats,
        strings,
        bytes,
      });
    }

    return {
      messages: decodedMessages,
    };
  }
}
