import * as flatbuffers from "flatbuffers";
import { GamePacket } from "./generated/game-protocol/game-packet.js";
import { MessagePayload } from "./generated/game-protocol/message-payload.js";

// Concrete Data Imports
import { MovePayload } from "./generated/game-protocol/move-payload.js";
import { MoveEvent } from "./generated/game-protocol/move-event.js";
import { CharacterSpawnEvent } from "./generated/game-protocol/character-spawn-event.js";
import { MapChunk } from "./generated/game-protocol/map-chunk.js";

export class Deserialize {
  public static packet(
    bytes: Uint8Array,
    router: {
      onMoveInput?: (payload: any, sequenceId: number) => void;
      onMoveVerified?: (payload: any, lastSequence: number) => void;
      onEntitySpawn?: (payload: any) => void;
      onMapChunk?: (payload: any) => void;
    },
  ): number {
    const buf = new flatbuffers.ByteBuffer(bytes);
    const packet = GamePacket.getRootAsGamePacket(buf);
    const totalMessages = packet.messagesLength();

    for (let i = 0; i < totalMessages; i++) {
      const envelope = packet.messages(i);
      if (!envelope) continue;

      const payloadType = envelope.payloadType();
      console.log("bingo", payloadType);
      const sequenceId = Number(envelope.sequenceId());

      switch (payloadType) {
        case MessagePayload.MovePayload: {
          const data = new MovePayload();
          if (envelope.payload(data) && router.onMoveInput) {
            router.onMoveInput(
              { w: data.w(), s: data.s(), a: data.a(), d: data.d() },
              sequenceId,
            );
          }
          break;
        }

        case MessagePayload.MoveEvent: {
          const data = new MoveEvent();
          if (envelope.payload(data) && router.onMoveVerified) {
            router.onMoveVerified(
              {
                characterId: data.characterId(),
                x: data.x(),
                y: data.y(),
              },
              sequenceId,
            );
          }
          break;
        }

        case MessagePayload.CharacterSpawnEvent: {
          const spawnEvent = new CharacterSpawnEvent();
          if (envelope.payload(spawnEvent) && router.onEntitySpawn) {
            const charTable = spawnEvent.character();
            if (charTable) {
              const playerTable = charTable.player();
              const zoneTable = charTable.zone();
              const statsTable = charTable.stats();

              router.onEntitySpawn({
                id: charTable.id(),
                name: charTable.name() ?? "",
                level: charTable.level(),
                isAlive: charTable.isAlive(),
                position: {
                  x: charTable.position() ? charTable.position()!.x() : 0,
                  y: charTable.position() ? charTable.position()!.y() : 0,
                },
                player: {
                  id: playerTable ? playerTable.id() : 0,
                  firstName: playerTable ? playerTable.firstName() : "",
                  lastName: playerTable ? playerTable.lastName() : "",
                },
                zone: {
                  id: zoneTable ? zoneTable.id() : "",
                  areaId: zoneTable ? zoneTable.areaId() : "",
                  mapPath: zoneTable ? zoneTable.mapName() : "",
                },
                stats: {
                  hp: statsTable ? statsTable.hp() : 0,
                  maxHp: statsTable ? statsTable.maxHp() : 0,
                },
              });
            }
          }
          break;
        }

        case MessagePayload.MapChunk: {
          const data = new MapChunk();
          if (envelope.payload(data) && router.onMapChunk) {
            router.onMapChunk({
              x: data.x(),
              y: data.y(),
              imageBytes: data.imageBytesArray(),
            });
          }
          break;
        }
        default:
          console.log(
            "⚠️ Unknown or unmatched payload type received:",
            payloadType,
          );
          break;
      }
    }

    return Number(packet.tick());
  }
}
