// ~/core/network/GameSerializer.ts
import * as flatbuffers from "flatbuffers";
import { GameProtocol } from "~/shared/serialize/generated/index.js";
import {
  OpCode,
  type ICharacter,
  type IMovePayload,
  type IPendingAction,
} from "~/shared/serialize/@types.js";

// 1. 🟢 IMPORT ALL WORLD STATE ELEMENTS FROM THEIR KEBAB-CASE FILES
import { WorldStateUpdate } from "./generated/game-protocol/world-state-update.js";
import { ComponentUpdate } from "./generated/game-protocol/component-update.js";
import { MoveEvent as FbsMoveEvent } from "./generated/game-protocol/move-event.js";
import { OutboundEvent } from "./generated/game-protocol/outbound-event.js";

import { ActionPayload } from "./generated/game-protocol/action-payload.js";
import { MovePayload } from "./generated/game-protocol/move-payload.js";
import { ActionData } from "./generated/game-protocol/action-data.js";
import { ClientBatchPacket } from "./generated/game-protocol/client-batch-packet.js";

export class Serialize {
  /**
   * Translates a runtime Character entity into a flat binary Uint8Array
   */
  public static character(character: ICharacter): Uint8Array {
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
    const mapName = builder.createString(character.zone.mapPath);
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
    const builder = new flatbuffers.Builder(1024);
    const { MapChunk } = GameProtocol;

    const imgBytesOffset = MapChunk.createImageBytesVector(
      builder,
      data.imageBytes,
    );

    MapChunk.startMapChunk(builder);
    MapChunk.addX(builder, data.x);
    MapChunk.addY(builder, data.y);
    MapChunk.addImageBytes(builder, imgBytesOffset);
    const chunkOffset = MapChunk.endMapChunk(builder);

    builder.finish(chunkOffset);

    return Serialize.prependedPacket(OpCode.MAP_CHUNK, builder.asUint8Array());
  }

  public static pendingActions(actions: IPendingAction<any>[]): Uint8Array {
    const builder = new flatbuffers.Builder(2048);
    const actionOffsets: number[] = [];

    for (const action of actions) {
      let payloadOffset = 0;
      let unionType = ActionPayload.NONE;

      if (action.type === "MOVE") {
        const moveData = action.payload as IMovePayload;

        MovePayload.startMovePayload(builder);
        MovePayload.addW(builder, moveData.w);
        MovePayload.addS(builder, moveData.s);
        MovePayload.addA(builder, moveData.a);
        MovePayload.addD(builder, moveData.d);

        payloadOffset = MovePayload.endMovePayload(builder);
        unionType = ActionPayload.MovePayload;
      }

      if (unionType === ActionPayload.NONE) continue;

      ActionData.startActionData(builder);
      ActionData.addSequenceId(builder, action.sequenceId);
      ActionData.addPayloadType(builder, unionType);
      ActionData.addPayload(builder, payloadOffset);

      actionOffsets.push(ActionData.endActionData(builder));
    }

    const actionsVectorOffset = ClientBatchPacket.createActionsVector(
      builder,
      actionOffsets,
    );

    ClientBatchPacket.startClientBatchPacket(builder);
    ClientBatchPacket.addActions(builder, actionsVectorOffset);
    const batchOffset = ClientBatchPacket.endClientBatchPacket(builder);

    builder.finish(batchOffset);

    return Serialize.prependedPacket(
      OpCode.CLIENT_BATCH_INPUT,
      builder.asUint8Array(),
    );
  }

  /**
   * Translates an array of server-calculated tick events into a flat binary packet
   */
  public static worldState(events: any[]): Uint8Array {
    const builder = new flatbuffers.Builder(2048);
    const updateOffsets: number[] = [];

    for (const event of events) {
      if (event.type === "MOVE") {
        // Step A: Build the concrete MoveEvent table using the aliased FbsMoveEvent
        FbsMoveEvent.startMoveEvent(builder);
        FbsMoveEvent.addCharacterId(builder, event.characterId);
        FbsMoveEvent.addX(builder, event.x);
        FbsMoveEvent.addY(builder, event.y);
        const moveEventOffset = FbsMoveEvent.endMoveEvent(builder);

        // Step B: Build the ComponentUpdate wrapper pairing it with the sequence ID
        ComponentUpdate.startComponentUpdate(builder);
        ComponentUpdate.addLastProcessedId(builder, event.lastProcessedId);
        ComponentUpdate.addPayloadType(builder, OutboundEvent.MoveEvent);
        ComponentUpdate.addPayload(builder, moveEventOffset);

        const componentOffset = ComponentUpdate.endComponentUpdate(builder);
        updateOffsets.push(componentOffset);
      }
    }

    // Step C: Create the vector array of updates and finish the root table
    const updatesVectorOffset = WorldStateUpdate.createUpdatesVector(
      builder,
      updateOffsets,
    );

    WorldStateUpdate.startWorldStateUpdate(builder);
    WorldStateUpdate.addUpdates(builder, updatesVectorOffset);
    const worldStateOffset = WorldStateUpdate.endWorldStateUpdate(builder);

    builder.finish(worldStateOffset);

    return Serialize.prependedPacket(
      OpCode.WORLD_STATE_UPDATE,
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
