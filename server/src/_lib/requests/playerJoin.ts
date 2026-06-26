import { Serialize } from "~/shared/proto/serializer";
import {
  fetchCharacter,
  fetchPlayer,
  fetchZoneMap,
} from "~/_utils/functions/fetchCharacter";
import Character from "~/core/character/Character";
import Player from "~/core/character/Player";
import type { IConnectionHandler, ConnectionContext } from "~/core/game/@types";
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
      const character = new Character(characterData);

      player.isAlive = true;
      character.player = player;

      const zoneMap = await fetchZoneMap(character.zoneMap);
      character.zoneMap = "placeholder";

      Log.SERVER.INFO(`${player.fullName} has connected!`);

      this.game.world.join(character);

      const payload: Uint8Array = Serialize.character(character);
      player.send(payload);
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  }
}
