import type { Config } from "~/types/system";
import type { SavedWorld } from "~/types/world";
import type { Command, ICommandHandler } from "~/types/game";
import type Player from './Player';
import Loop from "~/core/Loop";
import Server from "~/core/Server";
import World from "~/core/World";
import Log from "~/core/Logger";
import CheckInventoryCommand from "~/lib/commands/checkInventory";
import JoinWorldCommand from '~/lib/commands/joinWorld';
import SaveCommand from '~/lib/commands/save';
import LeaveWorldCommand from '~/lib/commands/leaveWorld';
import TestCombatCommand from '~/lib/commands/testCombat';
import SleepCommand from '~/lib/commands/sleep';
import ScoreCommand from '~/lib/commands/score';

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
    this.commandHandlers.set("JOIN_WORLD", new JoinWorldCommand());
    this.commandHandlers.set("LEAVE_WORLD", new LeaveWorldCommand());
    this.commandHandlers.set("CHECK_INVENTORY", new CheckInventoryCommand());
    this.commandHandlers.set("SAVE", new SaveCommand());
    this.commandHandlers.set("TEST_COMBAT", new TestCombatCommand());
    this.commandHandlers.set("SLEEP", new SleepCommand());
    this.commandHandlers.set("SCORE", new ScoreCommand());
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

    handler.execute({ player, game: this, data: command.data });
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
      this.world.logger.info(`${character.name} has left the world.`);
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