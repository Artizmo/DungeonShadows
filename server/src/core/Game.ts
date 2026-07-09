import type Loop from "~/core/Loop";
import type Network from "~/core/Network";
import type World from "~/core/World";
import type Character from "~/core/Character";
import { Serialize } from "~/shared/network/serialize";
import { ActionRegistry } from "./actions";
import { ActionType } from "~/shared/core/types";

export default class Game {
  readonly loop: Loop;
  network: Network;
  world: World;
  activeCharacters: Map<number, Character> = new Map();
  isReady = false;

  constructor(loop: Loop, network: Network, world: World) {
    this.loop = loop;
    this.network = network;
    this.world = world;
  }

  public start(): void {
    this.isReady = true;
    this.loop.start();

    this.loop.onUpdate = (deltaTime: number) => {
      if (!this.isReady) return;

      this.update(deltaTime);
    };

    this.loop.onTick = (tick: number) => {
      if (!this.isReady) return;

      this.tick(tick);
    };

    this.network.registerTickProvider(() => this.loop.tick);

    this.network.events.on("new_connection", (playerCharacter) => {
      this.onNewConnection(playerCharacter);
    });
  }

  public update(deltaTime: number): void {}

  tick(tick: number) {
    while (this.network.packetQueue.length > 0) {
      const queueItem = this.network.packetQueue.shift();
      if (!queueItem) return;

      const packet = Serialize.decode(queueItem.bytes);
      // if (packet.type !== GameProtocol.PacketPayload.ActionRecord) return;

      // const record = packet.data;
      // const handler = ActionRegistry.get(record.type());

      // if (!handler) {
      //   Log.SYSTEM.ERROR(`No handler found for action type: ${record.type()}!`);
      //   return;
      // }

      // const characterId = record.payload().characterId();
      // const dt = Math.min(record.dt(), 0.1);
      // handler.execute({ characterId }, this, dt);
    }
  }

  onNewConnection(playerCharacter): void {
    const handler = ActionRegistry.get(ActionType.JOIN);
    handler.execute(playerCharacter, this);
  }
}
