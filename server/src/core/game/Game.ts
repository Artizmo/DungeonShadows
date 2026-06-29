import { Log } from "~/shared/core/Logger";
import Loop from "~/core/game/Loop";
import Server from "~/core/game/Server";
import World from "~/core/world/World";
import {
  GameEventType,
  type Config,
  type GameEventMap,
  type IGameHandler,
  type MoveCommandEvent,
  type MoveEvent,
  type NetworkMessage,
  type PendingEvent,
} from "~/core/game/@types";
import { REQUEST_REGISTRY } from "~/_lib/requests";
import { MapCache } from "~/_utils/mapCache";
import type Character from "~/core/character/Character";
import { Serialize } from "~/shared/serialize/serializer";

export default class Game {
  readonly config: Config;
  readonly loop: Loop;
  public server!: Server;
  public world!: World;
  public mapCache: MapCache = new MapCache();
  public activeCharacters: Map<number, Character> = new Map();
  public isReady = false;
  private readonly requestHandlers = new Map<
    keyof GameEventMap,
    IGameHandler<any>
  >();

  constructor(config: Config) {
    this.config = config;
    this.loop = new Loop(this.config);
    this.registerHandlers();
  }

  private registerHandlers(): void {
    let handlerKey: keyof GameEventMap;

    for (handlerKey in REQUEST_REGISTRY) {
      const Handler = REQUEST_REGISTRY[handlerKey];
      this.requestHandlers.set(handlerKey, new Handler(this));
    }
  }

  public start(worldPath: string): void {
    this.world = new World(worldPath);
    this.server = new Server(this.config);
    this.isReady = true;
    this.loop.start();

    // [ ] implement the same events registry as World has

    this.loop.events.on("UPDATE", (deltaTime: number) => {
      if (!this.isReady) return;

      this.handleUpdate(deltaTime);
    });

    this.loop.events.on("TICK", (tick: number) => {
      if (!this.isReady) return;

      this.handleTick(tick);
    });

    this.server.events.on("player_disconnect", (playerId: number) => {
      this.bootPlayer(playerId);
    });

    this.server.events.on("player_join", (playerConnection) => {
      this.handlePlayerJoin(playerConnection);
    });

    this.server.events.on("route_requests", ({ request, characterId }) => {
      this.routeRequests(request, characterId);
    });
  }

  public async handlePlayerJoin({
    playerId,
    characterId,
    connection,
  }): Promise<void> {
    const handler = this.requestHandlers.get("PLAYER_JOIN");
    await handler.execute({ playerId, characterId, connection });
  }

  public handleUpdate(deltaTime: number): void {
    this.update(deltaTime);
  }

  public handleTick(tick: number): void {
    this.tick(tick);
  }

  public async routeRequests(
    request: NetworkMessage,
    characterId: number,
  ): Promise<void> {
    if (!this.isReady) return;
    if (!characterId) return;

    const character = this.world.characters.get(characterId);
    const handler = this.requestHandlers.get(
      request.type as keyof GameEventMap,
    );

    if (!handler) {
      // player.send({
      //   type: "WARN",
      //   data: `No message handler found for: ${request.type}`,
      // });
      Log.SYSTEM.WARN(`No message handler found for: ${request.type}`);
      return;
    }

    try {
      await handler.execute({
        character,
        game: this,
        data: request.data,
        args: request.data?.args || [],
      });
    } catch (e) {
      // player.send({ type: "ERROR", data: `Error executing handler: ${e}` });
      Log.SYSTEM.ERROR(`Error executing handler: ${e}`);
    }
  }

  public update(tick: number): void {
    this.world.update(tick);
  }

  // Inside Game.ts (Your Fixed Server Tick Loop)
  public tick(tick: number): void {
    // 1. Loop through characters who received packets during this frame window
    for (const [characterId, character] of this.activeCharacters) {
      const tickEventsToBroadcast: MoveEvent[] = [];
      // 2. Extract the completed MoveEvents your handler already calculated
      const events = character.pendingEvents;

      console.log("bingo", events.length);
      for (const event of events) {
        if (event.type === GameEventType.MOVE) {
          // TypeScript is completely happy here because MoveEvent naturally has x, y, and characterId!
          tickEventsToBroadcast.push(event);
        }
      }

      // 3. Wipe the character queue clean so they don't double-broadcast next tick
      character.pendingEvents = [];

      // 4. Phase 4: Pass the accumulated updates to your FlatBuffer broadcaster
      if (tickEventsToBroadcast.length > 0) {
        // this.broadcastTickUpdates(tickEventsToBroadcast);
        const events = Serialize.worldState(tickEventsToBroadcast);
        character.player.send(events);
      }
    }

    // 5. Clean the active set tracking for the next frame window
    this.activeCharacters.clear();
    this.world.tick(tick);
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
