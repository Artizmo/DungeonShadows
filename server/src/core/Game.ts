import type { Config } from "~/types/system";
import type { Request, IRequestHandler } from "~/types/game";
import type Player from "~/core/Player";
import Loop from "~/core/Loop";
import Server from "~/core/Server";
import World from "~/core/World";
import Log from "~/shared/core/Logger";
import { REQUEST_REGISTRY } from "~/lib/requests";
import type Character from "./Character";

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
    this.world = new World(worldPath, this);
    this.server = new Server(this.config, this);
    this.isReady = true;
    this.loop.start();
  }

  public async routeRequests(request: Request, player: Player): Promise<void> {
    if (!this.isReady) return;

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

    // Executes logic at the exact same 60fps frequency as the client
    this.world.update(tick);
  }

  public tick(tick: number): void {
    if (!this.isReady) return;

    // Executes slower gameplay state changes (e.g., processing the action queue)
    // at the exact same network tick frequency as the client
    this.world.tick(tick);
  }

  public join(character: Character): void {
    if (!this.world || !character) return;

    this.world.join(character);
  }

  public shutdownPlayer(player: Player): void {
    const { character } = player;
    if (!character) return;
    try {
      this.world.leave(character);
      Log.WORLD.INFO(`${character.name} has left the world.`);
    } catch (e) {
      Log.SYSTEM.ERROR(e);
    }
  }

  public shutdown(): void {
    this.isReady = false;
    this.loop.stop();
    this.server.close();
    Log.SYSTEM.INFO("Game instance successfully shutdown.");
  }
}
