import { Log } from "~/shared/core/Logger";
import { EventEmitter } from "events";
import Loop from "~/core/Loop";
import Server from "~/core/Server";
import World from "~/core/World";
import type { Config } from "~/types/system";
import type { Request, IRequestHandler } from "~/types/game";
import type Player from "~/core/Player";
import type Character from "./Character";
import { REQUEST_REGISTRY } from "~/lib/requests";
import {
  fetchCharacter,
  fetchPlayer,
  fetchZoneMap,
} from "~/utils/functions/fetchCharacter";

export default class Game {
  private readonly requestHandlers: Map<string, IRequestHandler> = new Map();
  readonly config: Config;
  readonly loop: Loop;
  server!: Server;
  world!: World;

  public readonly players: Map<number, Player> = new Map();
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
    this.world = new World(worldPath, this);
    this.server = new Server(this.config, this);
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

    const player = this.players.get(playerId);
    if (!player) return;

    const handler = this.requestHandlers.get(request.type);
    if (!handler) {
      player.send({
        type: "WARN",
        data: `No message handler found for: ${request.type}`,
      });
      Log.SYSTEM.WARN(`No message handler found for: ${request.type}`);
      return;
    }

    try {
      await handler.execute({
        player,
        game: this,
        data: request.data,
        args: request.data?.args || [],
      });
    } catch (e) {
      player.send({ type: "ERROR", data: `Error executing handler: ${e}` });
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
      const zone = await fetchZoneMap();
      const player = await fetchPlayer(playerId);
      const character = await fetchCharacter(characterId);

      character.playerId = playerId;
      character.zoneMap = zone;
      player.character = character;
      player.isAlive = true;

      this.players.set(playerId, player);
      this.world.join(character);
      Log.SERVER.INFO(`${player.fullName} has successfully connected!`);
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
      return;
    }
  }

  public bootPlayer(playerId: number): void {
    if (!playerId) return;

    const player = this.players.get(playerId);

    if (!player.character) return;

    try {
      this.world.leave(player.character);
      Log.WORLD.INFO(`${player.character.name} has left the world.`);
    } catch (e) {
      Log.SYSTEM.ERROR(e);
    }
  }
}
