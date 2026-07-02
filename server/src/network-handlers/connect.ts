import { Serialize } from "~/shared/network/serializer";
import { fetchCharacter, fetchPlayer } from "~/_utils/functions/fetchCharacter";
import Character from "~/core/character/Character";
import Player from "~/core/character/Player";
import type { IConnectionHandler, ConnectionContext } from "~/core/game/types";
import type Game from "~/core/game/Game";
import { Log } from "~/shared/core/Logger";
import { PacketRegistry } from "~/shared/network/packet-structures";
import { GameProtocol } from "~/shared/network/generated";

export class ConnectHandler implements IConnectionHandler {
  constructor(private readonly game: Game) {}

  public async execute({
    playerId,
    characterId,
    connection,
  }: ConnectionContext): Promise<void> {
    try {
      const [playerData, characterData] = await Promise.all([
        fetchPlayer(playerId),
        fetchCharacter(characterId),
      ]);
      const player = new Player(playerData, connection);
      Log.SERVER.INFO(`${player.fullName} has connected!`);
      const character = new Character(characterData);
      character.player = player;
      this.game.world.join(character);

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
      const mapChunks = await this.game.mapCache.getZoneMapChunks(
        character.zone,
      );
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
  }
}
