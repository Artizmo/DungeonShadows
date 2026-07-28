import ActsManager from "~/core/ActsManager";
import { Serialize } from "~/shared/core/serialize";
import { ActionRegistry } from "./handlers";
import { ActionType } from "~/shared/core/types";
import type Loop from "~/core/Loop";
import type Network from "~/core/Network";
import type World from "~/core/World";
import type Character from "~/core/Character";
import type StateManager from "~/core/StateManager";
import { FLAG_POSITION } from "~/shared/core/constants";

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

  async tick(tick: number, deltaTime: number): Promise<void> {
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

          handler.handle({
            data: {
              activeCommands: new Set(data.activeCommands),
              deltaTime: this.DELTA_TIME,
              sequenceId: data.sequenceId,
            },
            character,
            game: this,
          });
        }
      }

      character.lastProcessedSequenceId = data.sequenceId;
    }

    // 2. World Streaming (Spatial Updates & Chunk Delivery)
    const streamingPromises = [];

    for (const character of this.world.characters.values()) {
      if ((this.world.entityFlags[character.id] & FLAG_POSITION) !== 0) {
        streamingPromises.push(
          (async () => {
            const spatialZone =
              await this.world.updateCharacterSpatialZone(character);

            if (
              spatialZone.chunks.length > 0 ||
              spatialZone.unchunks.length > 0
            ) {
              this.network.broadcast.sendTo(
                character.id,
                Serialize.data({
                  actionType: ActionType.ZONE_UPDATE,
                  serverTick: tick,
                  chunks: spatialZone.chunks,
                  unchunks: spatialZone.unchunks,
                  zone: { ...spatialZone.zone },
                })
              );
            }
          })()
        );
      }
    }

    if (streamingPromises.length > 0) {
      await Promise.all(streamingPromises);
    }

    // 3. Delegate Snapshot Building to StateManager
    const recipientSnapshots = this.stateManager.buildSnapshots();

    // 4. Dispatch Tailored Snapshots
    for (const [recipientId, deltas] of recipientSnapshots.entries()) {
      // if (deltas.length === 0) continue;

      const recipientCharacter = this.world.characters.get(recipientId);
      if (!recipientCharacter) continue;

      const updatePayload = Serialize.snapshot({
        tick,
        lastProcessedSequenceId: recipientCharacter.lastProcessedSequenceId,
        entities: deltas,
      });

      setTimeout(() => {
        this.network.broadcast.sendTo(recipientId, updatePayload);
      }, 38);
    }

    // 5. Cleanup Dirty Flags and Despawn Memory
    this.world.postTickCleanup();
  }

  async onNewConnection(character: Character): Promise<void> {
    const handler = ActionRegistry.get(ActionType.CONNECT);
    if (handler) await handler.handle({ data: character, game: this });
  }

  async onCloseConnection(character: Character): Promise<void> {
    const handler = ActionRegistry.get(ActionType.DISCONNECT);
    if (handler) await handler.handle({ data: character, game: this });
  }
}
