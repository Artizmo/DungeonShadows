import type Loop from "~/core/Loop";
import type Network from "~/core/Network";
import type World from "~/core/World";
import type Character from "~/core/Character";
import { Serialize } from "~/shared/core/serialize";
import { ActionRegistry } from "./actions";
import { ActionType } from "~/shared/core/types";
import type StateManager from "~/core/StateManager";

export default class Game {
  readonly loop: Loop;
  network: Network;
  world: World;
  isReady = false;
  private stateManager: StateManager;
  private readonly DELTA_TIME = 1 / 20;

  constructor(loop: Loop, network: Network, world: World, stateManager: StateManager) {
    this.loop = loop;
    this.network = network;
    this.world = world;
    this.stateManager = stateManager;
  }

  public start(): void {
    this.isReady = true;
    this.loop.start();

    this.loop.onTick = (tick: number) => {
      if (!this.isReady) return;
      this.tick(tick);
    };

    this.network.registerTickProvider(() => this.loop.tick);

    this.network.events.on("new_connection", (character) => {
      this.onNewConnection(character);
    });
    this.network.events.on("connection_closed", (character) => {
      this.onCloseConnection(character);
    });
  }

  tick(tick: number): void {
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
    for (const character of this.world.characters.values()) {
      const isDirty = this.world.dirtyEntities.has(character);

      // Extract delta if dirty; otherwise send an empty state slice
      const { flags, state } = isDirty ? this.stateManager.getDirtyState(character) : {};
      const updatePayload = Serialize.snapshot({
        tick,
        state,
        flags,
        lastProcessedSequenceId: character.lastProcessedSequenceId,
      });

      // Reset dirty state on entity
      if (isDirty) {
        character.dirtyFlags = 0;
      }

      // Buffer packet for network dispatch
      setTimeout(() => {
        this.network.broadcast.sendTo(character.id, updatePayload);
      }, 38);
    }

    // Clear tracking set after all snapshots are queued
    this.world.dirtyEntities.clear();
  }

  async onNewConnection(character: Character): Promise<void> {
    const handler = ActionRegistry.get(ActionType.JOIN);

    if (handler) await handler.execute({ data: character, game: this });
  }

  async onCloseConnection(character: Character): Promise<void> {
    const handler = ActionRegistry.get(ActionType.LEAVE);

    if (handler) await handler.execute({ data: character, game: this });
  }
}
