import { GAME_CONFIG } from "~/shared/constants";
import World from "~/core/World";
import Network from "~/core/Network";
import Area from "~/core/Area";
import Zone from "~/core/Zone";
import Character from "~/core/Character";
import type { EntityState, ServerTransport } from "~/shared/core/types";
import { ActionRegistry } from "~/shared/core/actions";

export default class Game {
  public world = new World();
  public network: Network;
  public clientSequences: Record<string, number> = {};
  public connectionToCharId = new Map<string, string>();

  private nextTick = performance.now();
  private lastBroadcastState = new Map<string, EntityState>();

  constructor(transport: ServerTransport) {
    this.network = new Network(transport);

    const startingArea = new Area("starting_area");
    startingArea.addZone(new Zone("forest_zone", "forest_bg.webp"));
    this.world.addArea(startingArea);

    this.world.add(
      new Character("localPlayer", 300, 200),
      "starting_area",
      "forest_zone",
    );
    this.world.add(
      new Character("dummy", 300, 200),
      "starting_area",
      "forest_zone",
    );

    // MOCK AUTHENTICATION: Associate the generic connection ID with the game entity
    this.connectionToCharId.set("client_conn_01", "localPlayer");
  }

  start(): void {
    const _loop = () => {
      const now = performance.now();
      if (now >= this.nextTick) {
        this.tick();
        this.nextTick += GAME_CONFIG.SERVER_TICK_RATE;
      }
      setTimeout(_loop, Math.max(0, this.nextTick - performance.now()));
    };
    _loop();
  }

  resetState(): void {
    const lp = this.world.get("localPlayer");
    const dummy = this.world.get("dummy");
    if (lp) {
      lp.health = 100;
      lp.mana = 100;
      this.world.markDirty(lp.id);
    }
    if (dummy) {
      dummy.health = 100;
      dummy.mana = 100;
      this.world.markDirty(dummy.id);
    }
  }

  tick(): void {
    const dt = GAME_CONFIG.SERVER_TICK_RATE / 1000;
    const dummy = this.world.get("dummy");

    if (dummy) {
      dummy.angle += 1.5 * dt;
      dummy.x = Math.round((300 + Math.cos(dummy.angle) * 150) * 1000) / 1000;
      dummy.y = Math.round((200 + Math.sin(dummy.angle) * 100) * 1000) / 1000;
      this.world.markDirty("dummy");
    }

    while (this.network.actionQueue.length > 0) {
      const envelope = this.network.actionQueue.shift()!;

      // Look up the character assigned to this specific socket connection
      const charId = this.connectionToCharId.get(envelope.connectionId);
      if (!charId) continue;

      const char = this.world.get(charId);
      if (!char) continue;

      const handler = ActionRegistry.get(envelope.packet.type);
      if (handler) {
        if (
          !handler.validate ||
          handler.validate(
            char,
            envelope.packet.payload,
            envelope.packet.dt,
            this.world,
          )
        ) {
          handler.update(
            char,
            envelope.packet.payload,
            Math.min(envelope.packet.dt, 0.1),
            this.world,
          );
        }
      }

      // Record the last sequence processed specifically for this character
      this.clientSequences[charId] = envelope.packet.sequenceId;
    }

    const entitiesDelta: Record<string, EntityState> = {};
    for (const id of this.world.dirtyEntities) {
      const char = this.world.get(id);
      if (!char) continue;

      const last = this.lastBroadcastState.get(id);
      if (
        !last ||
        last.x !== char.x ||
        last.y !== char.y ||
        last.mana !== char.mana ||
        last.health !== char.health
      ) {
        const state = {
          x: char.x,
          y: char.y,
          mana: char.mana,
          health: char.health,
          areaId: char.areaId,
          zoneId: char.zoneId,
        };
        entitiesDelta[id] = state;
        this.lastBroadcastState.set(id, state);
      }
    }
    this.world.clearDirty();

    this.network.broadcast({
      type: "STATE_UPDATE",
      serverTime: performance.now(),
      entitiesDelta,
      lastProcessedIds: this.clientSequences,
    });
  }
}
