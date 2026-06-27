import * as flatbuffers from "flatbuffers";
import { GameProtocol } from "./generated/index.js";
import type { Character, IMapChunkData } from "~/shared/serialize/@types.ts";

export class Deserialize {
  public static character(bytes: Uint8Array): Character {
    const buffer = new flatbuffers.ByteBuffer(bytes);

    // 2. Access the root table pointer
    const characterTable = GameProtocol.Character.getRootAsCharacter(buffer);

    // 3. Pull out the nested table safely (handle null-checks)
    // const statsTable = characterTable.stats();
    // const posStruct = characterTable.position();
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
      // player: characterTable.player(),
      level: characterTable.level(),
      zone: {
        id: zoneTable!.id() ?? "",
        areaId: zoneTable!.areaId() ?? "",
        mapName: zoneTable!.mapName() ?? "",
      },
      isAlive: characterTable.isAlive(),
      position: {
        x: characterTable.position()!.x() ?? 0,
        y: characterTable.position()!.y() ?? 0,
      },
      // stats: {
      //   hp: statsTable ? statsTable.hp() : 0,
      //   maxHp: statsTable ? statsTable.maxHp() : 0,
      // }
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
}
