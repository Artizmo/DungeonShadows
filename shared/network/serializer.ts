import * as flatbuffers from "flatbuffers";
import { GameProtocol } from "~/shared/network/generated/index.js";

export interface IUniversalMessage {
  type: GameProtocol.MessageType;
  actionType: GameProtocol.ActionType;
  sequenceId?: number;
  targetId?: number;
  tick?: number;
  lastProcessedId?: number;
  ints?: number[];
  floats?: number[];
  strings?: string[];
  bytes?: Uint8Array | null;
}

export class Serialize {
  public static packet(messages: IUniversalMessage[]): Uint8Array {
    const builder = new flatbuffers.Builder(1024);
    const envelopeOffsets: number[] = [];

    // 1. Serialize each message envelope from the inside out
    for (const message of messages) {
      let intsOffset = 0;
      let floatsOffset = 0;
      let stringsOffset = 0;
      let bytesOffset = 0;

      // Pack Ints Vector
      if (message.ints && message.ints.length > 0) {
        intsOffset = GameProtocol.MessageEnvelope.createIntsVector(
          builder,
          message.ints,
        );
      }

      // Pack Floats Vector
      if (message.floats && message.floats.length > 0) {
        floatsOffset = GameProtocol.MessageEnvelope.createFloatsVector(
          builder,
          message.floats,
        );
      }

      // Pack Strings Vector (FlatBuffers requires strings to be serialized individually first)
      if (message.strings && message.strings.length > 0) {
        const strOffsets = message.strings.map((str) =>
          builder.createString(str),
        );
        stringsOffset = GameProtocol.MessageEnvelope.createStringsVector(
          builder,
          strOffsets,
        );
      }

      // Pack Raw Bytes Vector (e.g., WebP chunk chunks)
      if (message.bytes && message.bytes.length > 0) {
        bytesOffset = GameProtocol.MessageEnvelope.createBytesVector(
          builder,
          message.bytes,
        );
      }

      // Build the individual Envelope Table
      GameProtocol.MessageEnvelope.startMessageEnvelope(builder);
      GameProtocol.MessageEnvelope.addType(builder, message.type);
      GameProtocol.MessageEnvelope.addActionType(builder, message.actionType);
      GameProtocol.MessageEnvelope.addSequenceId(
        builder,
        BigInt(message.sequenceId ?? 0),
      );
      GameProtocol.MessageEnvelope.addTargetId(builder, message.targetId ?? 0);

      if (intsOffset) GameProtocol.MessageEnvelope.addInts(builder, intsOffset);
      if (floatsOffset)
        GameProtocol.MessageEnvelope.addFloats(builder, floatsOffset);
      if (stringsOffset)
        GameProtocol.MessageEnvelope.addStrings(builder, stringsOffset);
      if (bytesOffset)
        GameProtocol.MessageEnvelope.addBytes(builder, bytesOffset);
      if (message.tick)
        GameProtocol.MessageEnvelope.addTick(builder, BigInt(message.tick));
      if (message.lastProcessedId)
        GameProtocol.MessageEnvelope.addLastProcessedId(
          builder,
          BigInt(message.lastProcessedId),
        );

      envelopeOffsets.push(
        GameProtocol.MessageEnvelope.endMessageEnvelope(builder),
      );
    }

    // 2. Pack the master array vector of message envelopes
    const messagesVectorOffset = GameProtocol.GamePacket.createMessagesVector(
      builder,
      envelopeOffsets,
    );

    // 3. Finish the GamePacket container root
    GameProtocol.GamePacket.startGamePacket(builder);
    GameProtocol.GamePacket.addMessages(builder, messagesVectorOffset);

    const packetOffset = GameProtocol.GamePacket.endGamePacket(builder);
    builder.finish(packetOffset);

    // 4. Return the clean raw buffer slice
    return builder.asUint8Array();
  }
}
