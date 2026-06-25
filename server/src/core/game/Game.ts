import { Log } from "~/shared/core/Logger";
import Loop from "~/core/game/Loop";
import Server from "~/core/game/Server";
import World from "~/core/world/World";
import type { Config } from "~/core/game/@types";
import type { Request, IRequestHandler } from "~/core/game/@types";
import type Player from "~/player/Player";
import type Character from "~/core/player/Character";
import { REQUEST_REGISTRY } from "~/_lib/requests";
import {
  fetchCharacter,
  fetchPlayer,
  fetchZoneMap,
} from "~/_utils/functions/fetchCharacter";

export default class Game {
  private readonly requestHandlers: Map<string, IRequestHandler> = new Map();
  readonly config: Config;
  readonly loop: Loop;
  server!: Server;
  world!: World;
  isReady = false;

  constructor(config: Config) {
    this.config = config;
    this.loop = new Loop(this.config, this);
    this.registerRequestHandlers();
  }

  private registerRequestHandlers(): void {
    for (const [trigger, RequestClass] of Object.entries(REQUEST_REGISTRY)) {
      this.requestHandlers.set(trigger, new RequestClass());
    }
  }

  public start(worldPath: string): void {
    this.world = new World(worldPath);
    this.server = new Server(this.config);
    this.isReady = true;
    this.loop.start();

    this.server.events.on("player_disconnect", (playerId: number) => {
      this.bootPlayer(playerId);
    });

    this.server.events.on("player_join", (playerConnection) => {
      this.joinPlayer(playerConnection);
    });

    this.server.events.on("route_requests", ({ request, playerId }) => {
      this.routeRequests(request, playerId);
    });
  }

  public async routeRequests(
    request: Request,
    playerId: number,
  ): Promise<void> {
    if (!this.isReady) return;

    const handler = this.requestHandlers.get(request.type);
    if (!handler) {
      // player.send({
      //   type: "WARN",
      //   data: `No message handler found for: ${request.type}`,
      // });
      Log.SYSTEM.WARN(`No message handler found for: ${request.type}`);
      return;
    }

    try {
      // await handler.execute({
      //   player,
      //   game: this,
      //   data: request.data,
      //   args: request.data?.args || [],
      // });
    } catch (e) {
      // player.send({ type: "ERROR", data: `Error executing handler: ${e}` });
      Log.SYSTEM.ERROR(`Error executing handler: ${e}`);
    }
  }

  public update(tick: number): void {
    if (!this.isReady) return;

    this.world.update(tick);
  }

  public tick(tick: number): void {
    if (!this.isReady) return;

    this.world.tick(tick);
  }

  public async joinPlayer({ characterId, playerId }): Promise<void> {
    try {
      const player: Player = await fetchPlayer(playerId);
      const character: Character = await fetchCharacter(characterId);
      const zoneMap = await fetchZoneMap(character.zoneMap);
      player.isAlive = true;
      character.player = player;
      Log.SERVER.INFO(`${player.fullName} has connected!`);
      this.world.join(character);
      player.send({ character });
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
      return;
    }
  }

  public bootPlayer(playerId: number): void {
    if (!playerId) return;

    try {
      for (const character of this.world.characters.values()) {
        if (character.player.id === playerId) {
          this.world.leave(character);
          Log.SERVER.INFO(`${character.player.fullName} has disconnected!`);
        }
      }
    } catch (e) {
      Log.SYSTEM.ERROR(e);
    }
  }
}
