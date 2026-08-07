import { Serialize } from "~/shared/core/serialize";
import { ActionRegistry } from "./handlers";
import { fetchCharacter } from "~/utils/fetchCharacter";

import type Loop from "~/core/Loop";
import type Network from "~/core/Network";
import type World from "~/core/World";
import { type ClientContext } from "~/shared/core/types";

export default class Game {
  readonly loop: Loop;
  network: Network;
  world: World;
  isReady = false;
  private readonly DELTA_TIME = 1 / 20;

  constructor(loop: Loop, network: Network, world: World) {
    this.loop = loop;
    this.network = network;
    this.world = world;
  }

  public start(): void {
    this.isReady = true;
    this.loop.start();

    this.loop.onTick = (tick: number, tickRate: number) => {
      if (!this.isReady) return;
      this.tick(tick, tickRate);
    };

    this.network.registerTickProvider(() => this.loop.tick);

    this.network.events.on("connect", (clientContext: ClientContext) => {
      this.onConnect(clientContext);
    });

    this.network.events.on("disconnect", (clientContext: ClientContext) => {
      this.onDisconnect(clientContext);
    });
  }

  async onConnect(clientContext: ClientContext): Promise<void> {
    const { characterId, playerId, camera } = clientContext;
    const character = await fetchCharacter(characterId, playerId, camera);
    this.world.connect(character);
  }

  async onDisconnect(clientContext: ClientContext): Promise<void> {
    const { characterId } = clientContext;
    this.world.disconnect(characterId);
  }

  async tick(tick: number, tickRate: number): Promise<void> {
    // -------------------------------------------------------------
    // PHASE 1: Process incoming client packet queue
    // -------------------------------------------------------------
    const packets = this.network.packetQueue;
    const packetCount = this.network.packetCount;

    if (packetCount > 0) {
      for (let i = 0; i < packetCount; i++) {
        const queueItem = packets[i];
        if (!queueItem.buffer) continue;

        const data = Serialize.decode(queueItem.buffer);

        const character = this.world.characters[data.characterId];
        if (!character) continue;

        if (data.sequenceId <= character.sequenceId) continue;
        const actions = data.actions;
        if (!actions || actions.length === 0) continue;

        const actionCount = actions.length;
        for (let j = 0; j < actionCount; j++) {
          const actionType = actions[j];
          const handler = ActionRegistry.get(actionType);
          if (!handler) continue;

          handler.handle(
            character,
            data.activeCommands,
            data.sequenceId,
            this.DELTA_TIME,
            this.world
          );
        }

        character.sequenceId = data.sequenceId;
      }

      for (let i = 0; i < packets.length; i++) {
        packets[i].buffer = null;
      }
      this.network.packetCount = 0;
    }

    // -------------------------------------------------------------
    // PHASE 2: Process outgoing snapshots (Dirty Delta or Heartbeat)
    // -------------------------------------------------------------
    await this.processOutgoingSnapshots(tick);
  }

  /**
   * 🟢 Serializes and broadcasts snapshots (or heartbeat ticks) to all connected players
   */
  private async processOutgoingSnapshots(tick: number): Promise<void> {
    const characters = this.world.characters;

    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      if (!character) continue;

      // 1. Fetch snapshot payload (either full dirty state or light heartbeat)
      const snapshotPayload = await this.world.getSnapshot(character.id, tick);

      // 🟢 Safety fallback: If getSnapshot returns null, skip broadcast
      if (!snapshotPayload) continue;

      // 2. Encode and send via direct WS/socket reference
      const binaryBuffer = Serialize.snapshot(snapshotPayload);
      this.network.broadcast.sendTo(character.id, binaryBuffer);

      // 3. Clear target bitmasks for the next frame
      this.world.clearState(character.id);
    }
  }
}
