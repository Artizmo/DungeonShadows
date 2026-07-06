import { Log } from "~/shared/core/Logger";
import Loop from "~/core/Loop";
import Network from "~/core/Network";
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
import { MapCache } from "~/_utils/mapCache";
import type Character from "~/core/Character";
import { Serialize } from "~/shared/network/serializer";
import { Deserialize } from "~/shared/network/deserializer";
import { ConnectHandler } from "~/network-handlers/connect";
import { ActionRegistry } from "~/core/actions/actionRegistry";
import { ActionType } from "~/shared/constants";
import { GameProtocol } from "~/shared/network/generated";

export default class Game {
  readonly config: Config;
  readonly loop: Loop;
  public network!: Network;
  public world!: World;
  public mapCache: MapCache = new MapCache();
  public activeCharacters: Map<number, Character> = new Map();
  public isReady = false;
  lastProcessedId: number;
  lastBroadcastState: Map<any, any>;

  constructor(config: Config) {
    this.config = config;
    this.loop = new Loop(this.config);
    this.lastProcessedId = 0;
    this.lastBroadcastState = new Map();
  }

  public start(worldPath: string): void {
    this.world = new World(worldPath);
    this.network = new Network(this.config);
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

    this.network.events.on("process_connection", (playerConnection) => {
      this.handlePlayerConnection(playerConnection);
    });

    this.network.events.on("process_disconnection", (playerId: number) => {
      this.handlePlayerDisconnection(playerId);
    });

    this.network.events.on("process_input", (request, characterId) => {
      this.handleCharacterInput(request, characterId);
    });
  }

  public async handlePlayerConnection({
    playerId,
    characterId,
    connection,
  }): Promise<void> {
    const handler = ActionRegistry.get(GameProtocol.ActionType.SPAWN);
    handler.execute({ playerId, characterId, connection }, { game: this });
  }

  public handlePlayerDisconnection(playerId: number): void {
    if (!playerId) return;

    try {
      for (const character of this.world.characters.values()) {
        if (character.player.id === playerId) {
          this.world.leave(character);
          Log.NETWORK.INFO(`${character.player.fullName} has disconnected!`);
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

    // const handler = new BatchInputRequest(this, character);

    // await handler.execute({
    //   character,
    //   game: this,
    //   data: request,
    // } as any);

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

  tick(tick: number) {
    while (this.network.actionQueue.length > 0) {
      const actionRecord = this.network.actionQueue.shift();
      const action = ActionRegistry.get(actionRecord.type);

      action.execute(actionRecord.data, { game: this });

      this.lastProcessedId = actionRecord.sequenceId;
    }

    const entitiesDelta = {};

    for (const id of this.world.dirtyEntities) {
      const character = this.world.characters.get(id);
      if (!character) continue;

      const last = this.lastBroadcastState.get(id);
      if (
        !last ||
        last.x !== character.position.x ||
        last.y !== character.position.y ||
        // last.mana !== character.stats. ||
        last.health !== character.stats.hp
      ) {
        entitiesDelta[id] = {
          x: character.position.x,
          y: character.position.y,
          // mana: character.mana,
          health: character.stats.hp,
          // areaId: character.areaId,
          // zoneId: character.zoneId,
        };
        this.lastBroadcastState.set(id, {
          x: character.position.x,
          y: character.position.y,
          // mana: character.mana,
          health: character.stats.hp,
          // areaId: character.areaId,
          // zoneId: character.zoneId,
        });
      }
    }
    this.world.clearDirty();

    const snapshot = {
      type: "STATE_UPDATE",
      serverTime: performance.now(),
      entitiesDelta: entitiesDelta,
      lastProcessedId: this.lastProcessedId,
    };
    // console.log("bingo broadcast snapshot");
    // this.network.broadcast(snapshot);
  }
}
