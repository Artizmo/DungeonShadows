import { Log } from "~/shared/core/Logger";
import Loop from "~/core/Loop";
import Server from "~/core/Server";
import World from "~/core/World";
import {
  GameEventType,
  type Config,
  type GameEventMap,
  type IGameHandler,
  type MoveCommandEvent,
  type MoveEvent,
  type NetworkMessage,
  type PendingEvent,
} from "~/core/types";
import { REQUEST_REGISTRY } from "~/_lib/requests";
import { MapCache } from "~/_utils/mapCache";
import type Character from "~/core/Character";
import { Serialize } from "~/shared/network/serializer";
import { PlayerJoinHandler } from "~/_lib/requests/playerJoin";
import { Deserialize } from "~/shared/network/deserializer";
import BatchInputRequest from "~/_lib/requests/batchInput";
import { ConnectHandler } from "~/network-handlers/connect";

export default class Game {
  readonly config: Config;
  readonly loop: Loop;
  public server!: Server;
  public world!: World;
  public mapCache: MapCache = new MapCache();
  public activeCharacters: Map<number, Character> = new Map();
  public isReady = false;

  constructor(config: Config) {
    this.config = config;
    this.loop = new Loop(this.config);
  }

  public start(worldPath: string): void {
    this.world = new World(worldPath);
    this.server = new Server(this.config);
    this.isReady = true;
    this.loop.start();

    this.loop.events.on("UPDATE", (deltaTime: number) => {
      if (!this.isReady) return;

      this.handleUpdate(deltaTime);
    });

    this.loop.events.on("TICK", (tick: number) => {
      if (!this.isReady) return;

      this.handleTick(tick);
    });

    this.server.events.on("process_connection", (playerConnection) => {
      this.handlePlayerConnection(playerConnection);
    });

    this.server.events.on("process_disconnection", (playerId: number) => {
      this.handlePlayerDisconnection(playerId);
    });

    this.server.events.on("process_input", (request, characterId) => {
      this.handleCharacterInput(request, characterId);
    });
  }

  public async handlePlayerConnection({
    playerId,
    characterId,
    connection,
  }): Promise<void> {
    const handler = new ConnectHandler(this);
    await handler.execute({ playerId, characterId, connection });
  }

  public handlePlayerDisconnection(playerId: number): void {
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

  public async handleCharacterInput(
    request: Uint8Array,
    characterId: number,
  ): Promise<void> {
    if (!this.isReady) return;
    if (!characterId || !request) return;

    // 1. Grab the active character from the world engine
    const character = this.world.characters.get(characterId);
    if (!character) return;

    // 3. Deserialize incoming client inputs

    const handler = new BatchInputRequest(this, character);

    await handler.execute({
      character,
      game: this,
      data: request,
    } as any);

    // 🟢 CRITICAL STEP: Track this character as active so they broadcast during the tick!
    this.activeCharacters.set(character.id, character);
  }

  public handleUpdate(deltaTime: number): void {
    this.update(deltaTime);
  }

  public handleTick(tick: number): void {
    this.tick(tick);
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

      []; // Refactor the tick so it uses actionRegistry
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
        const serializationPayload = tickEventsToBroadcast.map((event) => ({
          ...event,
          type: "MOVE_VERIFIED", // 🟢 This safely overwrites event.type to what you want
          lastSequence: event.lastProcessedId, // Explicitly map lastProcessedId to lastSequence
        }));
        // const events: Uint8Array = Serialize.packet(serializationPayload);
        // character.player.send(events);
      }
    }

    // 5. Clean the active set tracking for the next frame window
    this.activeCharacters.clear();
    this.world.tick(tick);
  }
}
