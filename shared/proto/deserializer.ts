import * as flatbuffers from "flatbuffers";
import { GameProtocol } from "./generated/index.js";
import type { Character } from "~/shared/proto/@types.ts";

export class Deserialize {
  public static character(bytes: Uint8Array): Character {
    const buffer = new flatbuffers.ByteBuffer(bytes);

    // 2. Access the root table pointer
    const characterTable = GameProtocol.Character.getRootAsCharacter(buffer);

    // 3. Pull out the nested table safely (handle null-checks)
    // const statsTable = characterTable.stats();
    // const posStruct = characterTable.position();
    const playerTable = characterTable.player();

    // 4. Return a perfectly mapped, non-flatbuffer-dependent object
    return {
      id: characterTable.id(),
      player: {
        id: playerTable!.id(),
        fullName: playerTable!.fullName() ?? "",
      },
      name: characterTable.name() ?? "",
      // player: characterTable.player(),
      // level: characterTable.level(),
      zoneMap: characterTable.zoneMap() ?? "",
      isAlive: characterTable.isAlive(),
      // position: {
      //   x: posStruct ? posStruct.x() : 0,
      //   y: posStruct ? posStruct.y() : 0,
      // },
      // stats: {
      //   hp: statsTable ? statsTable.hp() : 0,
      //   maxHp: statsTable ? statsTable.maxHp() : 0,
      // }
    };
  }
}
