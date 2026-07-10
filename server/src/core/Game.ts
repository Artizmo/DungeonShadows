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
  // activeCharacters: Map<number, Character> = new Map();
  isReady = false;

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

    this.network.events.on("new_connection", (playerCharacter) => {
      this.onNewConnection(playerCharacter);
    });
  }

  tick(tick: number) {
    // Track who actually needs an update this tick (optional optimization)
    const activePlayersThisTick = new Set<Character>();

    // 1. Process ALL pending inputs from clients first
    while (this.network.packetQueue.length > 0) {
      const queueItem = this.network.packetQueue.shift();
      if (!queueItem) continue;

      const data = Serialize.decode(queueItem.bytes);
      const character = this.world.characters.get(data.characterId);
      if (!character) continue;

      if (data.sequenceId <= character.lastProcessedSequenceId) continue;

      // 2. Re-simulate the actions exactly as the client did
      if (data.actions && data.actions.length > 0) {
        for (const actionType of data.actions) {
          const handler = ActionRegistry.get(actionType);
          if (!handler) continue;

          const FIXED_DELTA = 1 / 20;

          handler.execute({
            data: {
              activeCommands: new Set(data.activeCommands),
              speed: character.speed,
              deltaTime: FIXED_DELTA,
            },
            character,
            game: this,
          });
        }
      }

      character.lastProcessedSequenceId = data.sequenceId;
      activePlayersThisTick.add(character);
    }

    // 3. Broadcast the Authoritative State ONCE at the end of the tick
    for (const character of activePlayersThisTick) {
      const updatePayload = Serialize.snapshot({
        playerState: { x: character.position.x, y: character.position.y },
        lastProcessedSequenceId: character.lastProcessedSequenceId,
      });
      this.network.broadcast.sendTo(character.id, updatePayload);
    }

    this.network.packetQueue = [];
  }

  onNewConnection(playerCharacter: Character): void {
    const handler = ActionRegistry.get(ActionType.JOIN);
    if (handler) handler.execute({ data: playerCharacter, game: this });
  }
}
