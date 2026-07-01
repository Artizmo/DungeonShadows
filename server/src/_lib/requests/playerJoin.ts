import { Serialize } from "~/shared/serialize/serializer";
import { fetchCharacter, fetchPlayer } from "~/_utils/functions/fetchCharacter";
import Character from "~/core/character/Character";
import Player from "~/core/character/Player";
import type { IConnectionHandler, ConnectionContext } from "~/core/game/types";
import type Game from "~/core/game/Game";
import { Log } from "~/shared/core/Logger";

export class PlayerJoinHandler implements IConnectionHandler {
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
      const data: Uint8Array = Serialize.packet([
        { type: "CHARACTER_SPAWN", character },
      ]);

      player.send(data);

      // 🟢 Send MAP_CHUNK data from cache
      const mapChunks = await this.game.mapCache.getZoneMapChunks(
        character.zone,
      );

      for (const chunk of mapChunks) {
        const data: Uint8Array = Serialize.packet([
          {
            type: "MAP_CHUNK",
            data: {
              x: chunk.x,
              y: chunk.y,
              imageBytes: chunk.textureBytes,
            },
          },
        ]);
        player.send(data);
      }
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  }
}
