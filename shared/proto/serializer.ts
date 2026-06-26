// ~/core/network/GameSerializer.ts
import flatbuffers from "flatbuffers";
import { GameProtocol } from "~/shared/proto/generated/index.js";
import { Character, OpCode } from "~/shared/proto/@types.js";

export class Serialize {
  /**
   * Translates a runtime Character entity into a flat binary Uint8Array
   */
  public static character(character: Character): Uint8Array {
    const builder = new flatbuffers.Builder(1024);
    const { Character, Player } = GameProtocol;

    const name = builder.createString(character.name);
    const zoneMap = builder.createString(character.zoneMap);
    const playerFullName = builder.createString(character.player.fullName);

    Player.startPlayer(builder);
    Player.addId(builder, character.player.id);
    Player.addFullName(builder, playerFullName);
    const playerOffset = Player.endPlayer(builder);

    Character.startCharacter(builder);
    Character.addId(builder, character.id);
    Character.addName(builder, name);
    Character.addPlayer(builder, playerOffset);
    Character.addZoneMap(builder, zoneMap);
    Character.addIsAlive(builder, character.isAlive);

    const characterOffset = Character.endCharacter(builder);
    builder.finish(characterOffset);

    return Serialize.prependedPacket(
      OpCode.CHARACTER_SPAWN,
      builder.asUint8Array(),
    );
  }
  private static prependedPacket(
    opcode: OpCode,
    fbsBytes: Uint8Array,
  ): Uint8Array {
    const packet = new Uint8Array(1 + fbsBytes.byteLength);
    packet[0] = opcode;
    packet.set(fbsBytes, 1);
    return packet;
  }
}
