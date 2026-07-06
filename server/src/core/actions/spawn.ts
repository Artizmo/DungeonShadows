import { GameProtocol } from "~/shared/network/generated/index";
import { fetchCharacter, fetchPlayer } from "~/_utils/functions/fetchCharacter";
import Player from "../Player";
import { Log } from "~/shared/core/Logger";
import Character from "../Character";
import { PacketRegistry } from "~/shared/network/packet-structures";
import { Serialize } from "~/shared/network/serializer";
import type { IActionContext } from "~/shared/core/actions/types";
import type { IConnection } from "../types";

interface ISpawnAction {
  playerId: number;
  characterId: number;
  connection: IConnection;
}

export const Spawn = {
  async execute(
    { playerId, characterId, connection }: ISpawnAction,
    { game }: IActionContext,
  ): Promise<void> {
    try {
      const [playerData, characterData] = await Promise.all([
        fetchPlayer(playerId),
        fetchCharacter(characterId),
      ]);
      const player = new Player(playerData, connection);
      Log.NETWORK.INFO(`${player.fullName} has connected!`);
      const character = new Character(characterData);
      character.player = player;
      game.world.join(character);

      // 🟢 Send CHARACTER_SPAWN data
      const spawnLayout = PacketRegistry.get(GameProtocol.ActionType.SPAWN);
      const spawnPacket = spawnLayout.structure(
        character,
        character.lastProcessedId,
        character.id,
      );
      const data: Uint8Array = Serialize.packet([spawnPacket]);
      player.send(data);

      // 🟢 Send MAP_CHUNK data from cache
      const mapChunks = await game.mapCache.getZoneMapChunks(character.zone);
      for (const chunk of mapChunks) {
        const mapChunkLayout = PacketRegistry.get(
          GameProtocol.ActionType.MAP_CHUNK,
        );
        const mapChunkPacket = mapChunkLayout.structure(
          chunk,
          character.lastProcessedId,
          character.id,
        );
        const data: Uint8Array = Serialize.packet([mapChunkPacket]);
        player.send(data);
      }
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  },
};
