import type Loop from "~/core/Loop";
import type Network from "~/core/Network";
import type World from "~/core/World";
import type Character from "~/core/Character";
import { Serialize } from "~/shared/core/serialize";
import { ActionRegistry } from "./actions";
import { ActionType } from "~/shared/core/types";

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

  async tick(tick: number) {
    // 1. Process ALL pending inputs from clients first
    while (this.network.packetQueue.length > 0) {
      const queueItem = this.network.packetQueue.shift();
      if (!queueItem) continue;

      const data = Serialize.decode(queueItem.bytes);
      const character = this.world.characters.get(data.characterId);

      if (!character) continue;
      if (data.sequenceId <= character.lastProcessedSequenceId) continue;

      // 2. Notarize the client's actions
      if (data.actions && data.actions.length > 0) {
        for (const actionType of data.actions) {
          const handler = ActionRegistry.get(actionType);
          if (!handler) continue;

          await handler.execute({
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

    // 3. Broadcast the Authoritative State to ALL active characters in the world
    // This maintains the continuous downstream heartbeat
    for (const character of this.world.characters.values()) {
      const updatePayload = Serialize.snapshot({
        playerState: { x: character.position.x, y: character.position.y },
        lastProcessedSequenceId: character.lastProcessedSequenceId,
      });

      // Simulating network latency
      setTimeout(() => {
        this.network.broadcast.sendTo(character.id, updatePayload);
      }, 38);
    }
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
