import ActsManager from "~/core/ActsManager";
import { Serialize } from "~/shared/core/serialize";
import { ActionRegistry } from "./handlers";
import { ActionType } from "~/shared/core/types";
import type Loop from "~/core/Loop";
import type Network from "~/core/Network";
import type World from "~/core/World";
import type Character from "~/core/Character";
import type StateManager from "~/core/StateManager";
import { FLAG_DIRTY } from "~/shared/core/constants";

export default class Game {
  readonly loop: Loop;
  network: Network;
  world: World;
  isReady = false;
  private stateManager: StateManager;
  private actsManager: ActsManager;
  private readonly DELTA_TIME = 1 / 20;

  constructor(
    loop: Loop,
    network: Network,
    world: World,
    stateManager: StateManager
  ) {
    this.loop = loop;
    this.network = network;
    this.world = world;
    this.stateManager = stateManager;
    this.actsManager = new ActsManager(this.world);
  }

  public start(): void {
    this.isReady = true;
    this.loop.start();

    this.loop.onTick = (tick: number, deltaTime: number) => {
      if (!this.isReady) return;
      this.tick(tick, deltaTime);
    };

    this.network.registerTickProvider(() => this.loop.tick);

    this.network.events.on("new_connection", (character) => {
      this.onNewConnection(character);
    });

    this.network.events.on("connection_closed", (character) => {
      this.onCloseConnection(character);
    });
  }

  tick(tick: number, deltaTime: number): void {
    this.actsManager.tick(tick, deltaTime);

    // 1. Process client input queue
    const packets = this.network.packetQueue;
    this.network.packetQueue = [];

    for (let i = 0; i < packets.length; i++) {
      const queueItem = packets[i];
      const data = Serialize.decode(queueItem.bytes);
      const character = this.world.characters.get(data.characterId);

      if (!character) continue;
      if (data.sequenceId <= character.lastProcessedSequenceId) continue;

      if (data.actions && data.actions.length > 0) {
        for (const actionType of data.actions) {
          const handler = ActionRegistry.get(actionType);
          if (!handler) continue;

          handler.execute({
            data: {
              activeCommands: new Set(data.activeCommands),
              deltaTime: this.DELTA_TIME,
            },
            character,
            game: this,
          });
        }
      }

      character.lastProcessedSequenceId = data.sequenceId;
    }

    // 2. Uniform Snapshot / Heartbeat Loop

    // Phase A: Group dirty states by spatial bucket using activeEntityIds & entityFlags
    const bucketDeltas = new Map<string, any[]>();

    for (let i = 0; i < this.world.activeEntityCount; i++) {
      const entityId = this.world.activeEntityIds[i];

      // Check if entity is marked with FLAG_DIRTY
      if ((this.world.entityFlags[entityId] & FLAG_DIRTY) !== 0) {
        // Lookup entity (Check characters first, then compendium)
        const entity =
          this.world.characters.get(entityId) ||
          this.world.entityCompendium.get(entityId);

        if (!entity) continue;

        const state = this.stateManager.getDirtyState(entity);
        if (!state) continue;

        const bucketKey = entity.currentBucketId;
        if (!bucketKey) continue;

        if (!bucketDeltas.has(bucketKey)) {
          bucketDeltas.set(bucketKey, []);
        }

        bucketDeltas.get(bucketKey)!.push({
          ...state,
          flags: this.world.entityFlags[entityId], // Send actual bitmask flags
        });
      }
    }

    // Phase B: Dispatch tailored snapshots to connected characters based on AOI
    for (const character of this.world.characters.values()) {
      const visibleEntities: any[] = [];

      for (const bucketKey of character.AOIBucketKeys) {
        if (bucketDeltas.has(bucketKey)) {
          visibleEntities.push(...bucketDeltas.get(bucketKey)!);
        }
      }

      // Skip sending empty snapshots if nothing changed around them
      if (visibleEntities.length === 0) continue;

      const updatePayload = Serialize.snapshot({
        tick,
        lastProcessedSequenceId: character.lastProcessedSequenceId,
        entities: visibleEntities,
      });

      // Send payload to nearby player
      setTimeout(() => {
        this.network.broadcast.sendTo(character.id, updatePayload);
      }, 38);
    }

    // Phase C: Strip away the FLAG_DIRTY bit from active entities
    for (let i = 0; i < this.world.activeEntityCount; i++) {
      const entityId = this.world.activeEntityIds[i];

      // Bitwise AND NOT clears ONLY the DIRTY flag, keeping FLYING, INVISIBLE, SPAWNED, etc.
      this.world.entityFlags[entityId] &= ~FLAG_DIRTY;
    }
  }

  async onNewConnection(character: Character): Promise<void> {
    const handler = ActionRegistry.get(ActionType.CONNECT);

    if (handler) await handler.execute({ data: character, game: this });
  }

  async onCloseConnection(character: Character): Promise<void> {
    const handler = ActionRegistry.get(ActionType.DISCONNECT);

    if (handler) await handler.execute({ data: character, game: this });
  }
}
