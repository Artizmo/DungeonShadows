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

    this.network.events.on("disconnect", (characterId: number) => {
      this.onDisconnect(characterId);
    });
  }

  async onConnect(clientContext: ClientContext): Promise<void> {
    const { characterId, playerId, camera } = clientContext;
    const character = await fetchCharacter(characterId, playerId, camera);
    this.world.connect(character);
  }

  async onDisconnect(characterId: number): Promise<void> {
    // const handler = ActionRegistry.get(ActionType.DISCONNECT);
    // if (handler) await handler.handle({ data: character, game: this });
  }

  async tick(tick: number, tickRate: number): Promise<void> {
    // 1. Process packet queue without array reallocation
    const packets = this.network.packetQueue;
    const packetCount = packets.length;

    if (packetCount > 0) {
      for (let i = 0; i < packetCount; i++) {
        const queueItem = packets[i];
        if (!queueItem.buffer) continue;

        const data = Serialize.decode(queueItem.buffer);

        // Look up character from central EntityManager compendium
        const character = this.world.compendium[data.characterId];
        if (!character) continue;

        // Out-of-order packet drop & empty check
        if (data.sequenceId <= character.sequenceId) continue;
        const actions = data.actions;
        if (!actions || actions.length === 0) continue;

        const actionCount = actions.length;
        for (let j = 0; j < actionCount; j++) {
          const actionType = actions[j];
          const handler = ActionRegistry.get(actionType);
          if (!handler) continue;

          // Direct positional arguments: Zero object wrapper allocations
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

      // Clear queue in-place without reallocating memory
      packets.length = 0;

      // // 2. World Streaming (Spatial Updates & Chunk Delivery)
      // const streamingPromises = [];
      // for (const character of this.world.characters.values()) {
      //   // if ((this.world.entityFlags[character.id] & FLAG_POSITION) !== 0) {
      //   //   streamingPromises.push(
      //   //     (async () => {
      //   //       const spatialZone =
      //   //         this.world.updateCharacterSpatialZone(character);
      //   //       if (
      //   //         spatialZone.chunks.length > 0 ||
      //   //         spatialZone.unchunks.length > 0
      //   //       ) {
      //   //         this.network.broadcast.sendTo(
      //   //           character.id,
      //   //           Serialize.data({
      //   //             actionType: ActionType.ZONE_UPDATE,
      //   //             serverTick: tick,
      //   //             character,
      //   //             chunks: spatialZone.chunks,
      //   //             unchunks: spatialZone.unchunks,
      //   //             zone: { ...spatialZone.zone },
      //   //           })
      //   //         );
      //   //       }
      //   //     })()
      //   //   );
      //   // }
      // }
      // if (streamingPromises.length > 0) {
      //   await Promise.all(streamingPromises);
      // }
      // // this.world.updateCharacterAOI();
      // // 3. Delegate Snapshot Building to StateManager
      // const recipientSnapshots = this.stateManager.buildSnapshots();
      // // 4. Dispatch Tailored Snapshots
      // for (const [recipientId, deltas] of recipientSnapshots.entries()) {
      //   // if (deltas.length === 0) continue;
      //   const recipientCharacter = this.world.characters.get(recipientId);
      //   if (!recipientCharacter) continue;
      //   const updatePayload = Serialize.snapshot({
      //     tick,
      //     lastProcessedSequenceId: recipientCharacter.lastProcessedSequenceId,
      //     entities: deltas,
      //   });
      //   setTimeout(() => {
      //     this.network.broadcast.sendTo(recipientId, updatePayload);
      //   }, 38);
    }
    // 5. Cleanup Dirty Flags and Despawn Memory
    // this.world.postTickCleanup();
  }
}
