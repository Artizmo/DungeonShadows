// ~/core/network/GameSerializer.ts
import * as flatbuffers from "flatbuffers";
import { GameProtocol } from "~/shared/serialize/generated/index.js";
import { Character, OpCode } from "~/shared/serialize/@types.js";
import { Position } from "./generated/game-protocol.js";

export class Serialize {
  /**
   * Translates a runtime Character entity into a flat binary Uint8Array
   */
  public static character(character: Character): Uint8Array {
    const builder = new flatbuffers.Builder(1024);
    const { Character, Player, Zone, Position } = GameProtocol;

    const playerFirstName = builder.createString(character.player.firstName);
    const playerLastName = builder.createString(character.player.lastName);
    const playerEmail = builder.createString(character.player.email);
    Player.startPlayer(builder);
    Player.addId(builder, character.player.id);
    Player.addFirstName(builder, playerFirstName);
    Player.addLastName(builder, playerLastName);
    Player.addEmail(builder, playerEmail);
    const playerOffset = Player.endPlayer(builder);

    const zoneId = builder.createString(character.zone.id);
    const areaId = builder.createString(character.zone.areaId);
    const mapName = builder.createString(character.zone.mapName);
    Zone.startZone(builder);
    Zone.addId(builder, zoneId);
    Zone.addAreaId(builder, areaId);
    Zone.addMapName(builder, mapName);
    const ZoneOffset = Zone.endZone(builder);

    const name = builder.createString(character.name);
    Character.startCharacter(builder);
    Character.addId(builder, character.id);
    Character.addName(builder, name);
    Character.addLevel(builder, character.level);
    Character.addPlayer(builder, playerOffset);
    Character.addZone(builder, ZoneOffset);
    Character.addPosition(
      builder,
      Position.createPosition(
        builder,
        character.position.x,
        character.position.y,
      ),
    );
    Character.addIsAlive(builder, character.isAlive);
    const characterOffset = Character.endCharacter(builder);

    builder.finish(characterOffset);

    return Serialize.prependedPacket(
      OpCode.CHARACTER_SPAWN,
      builder.asUint8Array(),
    );
  }

  /**
   * Translates map tile data segments into a flat binary packet with OpCode header
   */
  public static mapChunk(data: {
    x: number;
    y: number;
    imageBytes: Uint8Array;
  }): Uint8Array {
    // Instantiate a local builder instance just like the character method
    const builder = new flatbuffers.Builder(1024);
    const { MapChunk } = GameProtocol;

    // 1. Serialize the raw image byte vector into the FlatBuffer context
    const imgBytesOffset = MapChunk.createImageBytesVector(
      builder,
      data.imageBytes,
    );

    // 2. Map coordinates alongside vector pointer offsets
    MapChunk.startMapChunk(builder);
    MapChunk.addX(builder, data.x);
    MapChunk.addY(builder, data.y);
    MapChunk.addImageBytes(builder, imgBytesOffset);
    const chunkOffset = MapChunk.endMapChunk(builder);

    builder.finish(chunkOffset);

    // 3. Match your character pattern: Glue your opcode prefix to frame zero!
    return Serialize.prependedPacket(
      OpCode.MAP_CHUNK, // Assuming you have MAP_CHUNK_DATA defined in OpCode enum
      builder.asUint8Array(),
    );
  }

  /**
   * Helper function to prepend a 1-byte opcode identifier onto the byte stream
   */
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
