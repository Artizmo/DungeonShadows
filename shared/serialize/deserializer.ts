import * as flatbuffers from "flatbuffers";
import { GameProtocol } from "./generated/index.js";
import {
  GameEventType,
  type Character,
  type IMapChunkData,
  type MoveEvent,
} from "~/shared/serialize/@types.js";

// 1. 🟢 IMPORT ALL WORLD STATE ELEMENTS DIRECTLY FROM THEIR KEBAB-CASE FILES
import { WorldStateUpdate } from "~/shared/serialize/generated/game-protocol/world-state-update.js";
import { ComponentUpdate } from "~/shared/serialize/generated/game-protocol/component-update.js";
import { OutboundEvent } from "~/shared/serialize/generated/game-protocol/outbound-event.js";
import { MoveEvent as FbsMoveEvent } from "~/shared/serialize/generated/game-protocol/move-event.js";

export class Deserialize {
  public static character(bytes: Uint8Array): Character {
    const buffer = new flatbuffers.ByteBuffer(bytes);

    // 2. Access the root table pointer
    const characterTable = GameProtocol.Character.getRootAsCharacter(buffer);

    // 3. Pull out the nested table safely (handle null-checks)
    const statsTable = characterTable.stats();
    const playerTable = characterTable.player();
    const zoneTable = characterTable.zone();

    // 4. Return a perfectly mapped, non-flatbuffer-dependent object
    return {
      id: characterTable.id(),
      player: {
        id: playerTable!.id(),
        firstName: playerTable!.firstName() ?? "",
        lastName: playerTable!.lastName() ?? "",
        email: playerTable!.email() ?? "",
      },
      name: characterTable.name() ?? "",
      level: characterTable.level(),
      zone: {
        id: zoneTable!.id() ?? "",
        areaId: zoneTable!.areaId() ?? "",
        mapPath: zoneTable!.mapName() ?? "",
      },
      isAlive: characterTable.isAlive(),
      position: {
        x: characterTable.position()!.x() ?? 0,
        y: characterTable.position()!.y() ?? 0,
      },
      stats: {
        hp: statsTable ? statsTable.hp() : 0,
        maxHp: statsTable ? statsTable.maxHp() : 0,
      },
    };
  }

  public static mapChunk(bytes: Uint8Array): IMapChunkData {
    // 1. Wrap the unshifted bytes (already stripped of OpCode by your multiplexer)
    const buf = new flatbuffers.ByteBuffer(bytes);

    // 2. Point directly to MapChunk since it was the root object finished by the server builder
    const fbsChunk = GameProtocol.MapChunk.getRootAsMapChunk(buf);

    // 3. Extract your primitives and the zero-copy array vector
    const x = fbsChunk.x();
    const y = fbsChunk.y();
    const imageBytes = fbsChunk.imageBytesArray(); // Returns the exact nested Uint8Array slice

    if (!imageBytes) {
      throw new Error(
        `❌ MapChunk deserialization failed at coordinates [${x}, ${y}]: Missing image bytes.`,
      );
    }

    return {
      x,
      y,
      imageBytes,
    };
  }

  /**
   * Translates an incoming binary WorldState byte block back into usable runtime updates
   */
  public static worldState(data: Uint8Array): MoveEvent[] {
    const buf = new flatbuffers.ByteBuffer(data);

    // 2. 🟢 Read the root structure cleanly using the exact top-level file imports
    const worldState = WorldStateUpdate.getRootAsWorldStateUpdate(buf);
    const updatesLength = worldState.updatesLength();
    const extractedEvents: MoveEvent[] = [];

    for (let i = 0; i < updatesLength; i++) {
      const componentUpdate = worldState.updates(i);
      if (!componentUpdate) continue;

      const lastProcessedId = componentUpdate.lastProcessedId();
      const payloadType = componentUpdate.payloadType();

      // Check the Union Type Discriminator to cleanly read memory pointers
      if (payloadType === OutboundEvent.MoveEvent) {
        const movePayload = new FbsMoveEvent();
        componentUpdate.payload(movePayload);

        extractedEvents.push({
          type: GameEventType.MOVE,
          characterId: movePayload.characterId(),
          x: movePayload.x(),
          y: movePayload.y(),
          lastProcessedId: lastProcessedId,
        });
      }

      // Future expansions (like DamageEvent) can be mapped seamlessly right here!
    }

    return extractedEvents;
  }
}
