import * as flatbuffers from "flatbuffers";
import { GamePacket } from "./generated/game-protocol/game-packet.js";
import { MessageEnvelope } from "./generated/game-protocol/message-envelope.js";
import { MessagePayload } from "./generated/game-protocol/message-payload.js";

// Layout Payload File Targets
import { MovePayload } from "./generated/game-protocol/move-payload.js";
import { MoveEvent } from "./generated/game-protocol/move-event.js";
import { CharacterSpawnEvent } from "./generated/game-protocol/character-spawn-event.js";
import { MapChunk } from "./generated/game-protocol/map-chunk.js";

// Structural Entities
import { GameProtocol } from "~/shared/serialize/generated/index.js";
import type { ICharacter } from "~/shared/types.js";

export class Serialize {
  public static packet(actions: any[]): Uint8Array {
    const builder = new flatbuffers.Builder(4096);
    const envelopeOffsets: number[] = [];

    for (const action of actions) {
      let dataOffset = 0;
      let unionType = MessagePayload.NONE;
      let sequenceId = action.sequenceId || 0;

      // 🛑 CASE 1: CLIENT MOVE INPUT
      if (action.type === "MOVE_INPUT" || action.type === "MOVE") {
        MovePayload.startMovePayload(builder);

        // 🟢 FIX: Extract the values from the nested payload object!
        MovePayload.addW(builder, action.payload?.w ?? false);
        MovePayload.addS(builder, action.payload?.s ?? false);
        MovePayload.addA(builder, action.payload?.a ?? false);
        MovePayload.addD(builder, action.payload?.d ?? false);

        dataOffset = MovePayload.endMovePayload(builder);
        unionType = MessagePayload.MovePayload;

        // Ensure your sequenceId assignment remains paired with the envelope header here
        sequenceId = action.sequenceId;
      }

      // 🛑 CASE 2: SERVER MOVE VERIFIED (Reconciliation Update)
      else if (action.type === "MOVE_VERIFIED") {
        MoveEvent.startMoveEvent(builder);
        MoveEvent.addCharacterId(builder, action.characterId);
        MoveEvent.addX(builder, action.x);
        MoveEvent.addY(builder, action.y);
        dataOffset = MoveEvent.endMoveEvent(builder);

        // 🟢 FIX: Ensure this points to MoveEvent so it sends Index 3!
        unionType = MessagePayload.MoveEvent;

        sequenceId = action.lastSequence;
      }

      // 🛑 CASE 3: CHARACTER ENTITY SPAWN
      else if (action.type === "SPAWN" || action.type === "CHARACTER_SPAWN") {
        const char: ICharacter = action.character;
        const { Player, Zone, Coords, CharacterData } = GameProtocol;

        const playerFirstName = builder.createString(char.player.firstName);
        const playerLastName = builder.createString(char.player.lastName);
        const playerEmail = builder.createString(char.player.email);
        Player.startPlayer(builder);
        Player.addId(builder, char.player.id);
        Player.addFirstName(builder, playerFirstName);
        Player.addLastName(builder, playerLastName);
        Player.addEmail(builder, playerEmail);
        const playerOffset = Player.endPlayer(builder);

        const zoneId = builder.createString(char.zone.id);
        const areaId = builder.createString(char.zone.areaId);
        const mapName = builder.createString(char.zone.mapPath);
        Zone.startZone(builder);
        Zone.addId(builder, zoneId);
        Zone.addAreaId(builder, areaId);
        Zone.addMapName(builder, mapName);
        const zoneOffset = Zone.endZone(builder);

        const charName = builder.createString(char.name);

        CharacterData.startCharacterData(builder);
        CharacterData.addId(builder, char.id);
        CharacterData.addName(builder, charName);
        CharacterData.addLevel(builder, char.level);
        CharacterData.addPlayer(builder, playerOffset);
        CharacterData.addZone(builder, zoneOffset);

        // 🟢 FIX: Position is a Struct, so it must be built directly INLINE here
        CharacterData.addPosition(
          builder,
          Coords.createCoords(builder, char.position.x, char.position.y),
        );
        CharacterData.addRenderPosition(
          builder,
          Coords.createCoords(builder, char.position.x, char.position.y),
        );

        CharacterData.addIsAlive(builder, char.isAlive);
        const charDataOffset = CharacterData.endCharacterData(builder);

        CharacterSpawnEvent.startCharacterSpawnEvent(builder);
        CharacterSpawnEvent.addCharacter(builder, charDataOffset);
        dataOffset = CharacterSpawnEvent.endCharacterSpawnEvent(builder);
        unionType = MessagePayload.CharacterSpawnEvent;
      }

      // 🛑 CASE 4: BINARY MAP CHUNK OVER THE WIRE
      else if (action.type === "MAP_CHUNK") {
        const { x, y, imageBytes } = action.data;

        if (!imageBytes) {
          throw new Error("Serialization failed: imageBytes is undefined!");
        }

        const imgBytesOffset = MapChunk.createImageBytesVector(
          builder,
          imageBytes,
        );
        MapChunk.startMapChunk(builder);
        MapChunk.addX(builder, x);
        MapChunk.addY(builder, y);
        MapChunk.addImageBytes(builder, imgBytesOffset);
        dataOffset = MapChunk.endMapChunk(builder);
        unionType = MessagePayload.MapChunk;
      }

      if (unionType === MessagePayload.NONE) continue;

      // Wrap inside standard message payload envelope
      MessageEnvelope.startMessageEnvelope(builder);
      MessageEnvelope.addSequenceId(builder, BigInt(sequenceId));
      MessageEnvelope.addPayloadType(builder, unionType);
      MessageEnvelope.addPayload(builder, dataOffset);
      envelopeOffsets.push(MessageEnvelope.endMessageEnvelope(builder));
    }

    // 1. Combine all structural envelopes into a Master Batch Vector
    const messagesVectorOffset = GamePacket.createMessagesVector(
      builder,
      envelopeOffsets,
    );

    // 2. 🟢 FIX: Keep the root object open loop intact
    GamePacket.startGamePacket(builder);
    GamePacket.addMessages(builder, messagesVectorOffset);

    // 3. 🟢 FIX: Calculate the offset cleanly separate from the finish call
    const rootOffset = GamePacket.endGamePacket(builder);
    builder.finish(rootOffset);

    // 4. Extract the clean, sliced network window frame
    const fullArray = builder.asUint8Array();
    return fullArray.slice(fullArray.length - builder.offset());
  }
}
