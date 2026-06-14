import type { Config } from "~/types/system";
import type { SavedWorld } from "~/types/world";
import type { Command, ICommandHandler } from "~/types/game";
import type Player from './Player';
import Loop from "~/core/Loop";
import Server from "~/core/Server";
import World from "~/core/World";
import Log from "~/core/Logger";
import { COMMAND_REGISTRY } from '~/lib/commands';

export default class Game {
  private readonly commandHandlers: Map<string, ICommandHandler> = new Map();

  readonly config: Config;
  readonly loop: Loop;
  server!: Server;
  world!: World;
  isReady = false;

  constructor(config: Config) {
    this.config = config;
    this.loop = new Loop(this.config, this);
    this.registerHandlers();
  }

  private registerHandlers(): void {
    for (const [trigger, CommandClass] of Object.entries(COMMAND_REGISTRY)) {
      this.commandHandlers.set(trigger, new CommandClass());
    }
  }

  public start(savedWorld: SavedWorld): void {
    this.world = new World(savedWorld, this);
    this.server = new Server(this.config, this);
    this.isReady = true;
    this.loop.start();
  }

  public routeCommands(command: Command, player: Player): void {
    if (!this.isReady) return;

    const handler = this.commandHandlers.get(command.type);
    if (!handler) {
      Log.SYSTEM.WARN(`No message handler found for: ${command.type}`);
      return;
    }

    handler.execute({
      player,
      game: this,
      data: command.data,
      args: command.data?.args || []
    });
  }

  public update(tick: number): void {
    if (!this.isReady) return;
    this.world.update(tick);
  }

  public tick(tick: number): void {
    if (!this.isReady) return;
    this.world.tick(tick);
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