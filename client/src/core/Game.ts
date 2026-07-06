import Network from "~/core/Network";
import KeyboardController from "~/core/KeyboardController";
import World from "~/core/World";
import Area from "~/core/Area";
import Zone from "~/core/Zone";
import Character from "~/core/Character";
import GamepadController from "~/core/GamepadController";
import MenuManager from "~/core/MenuManager";
import { GAME_CONFIG, INPUT_DICTIONARY } from "~/shared/constants";
import { CommandRegistry } from "~/core/commands";
import type {
  ActionRecord,
  ClientTransport,
  EntityState,
  Snapshot,
} from "~/shared/core/types";
import { ActionRegistry } from "~/shared/core/actions";

export default class Game {
  public localPlayerId = "localPlayer";
  public world = new World();
  public network: Network;
  public keyboard = new KeyboardController();
  public gamepad = new GamepadController();
  public menuManager = new MenuManager();
  public virtualInputs = new Set<string>();

  public pendingActions: ActionRecord[] = [];
  public sequenceId = 0;
  private stateBuffer: {
    serverTime: number;
    entities: Record<string, EntityState>;
  }[] = [];
  private renderTime = 0;
  private lastFrameTime = performance.now();
  private accumulator = 0;

  public lastKnownServerState: Record<string, EntityState> = {
    localPlayer: {
      x: 300,
      y: 200,
      mana: 100,
      health: 100,
      areaId: "starting_area",
      zoneId: "forest_zone",
    },
    dummy: {
      x: 300,
      y: 200,
      mana: 100,
      health: 100,
      areaId: "starting_area",
      zoneId: "forest_zone",
    },
  };

  constructor(transport: ClientTransport) {
    this.network = new Network(this, transport);

    const startingArea = new Area("starting_area");
    startingArea.addZone(new Zone("forest_zone", "forest_bg.webp"));
    this.world.addArea(startingArea);
    this.world.add(
      new Character(this.localPlayerId, 300, 200),
      "starting_area",
      "forest_zone",
    );
    this.world.add(
      new Character("dummy", 300, 200),
      "starting_area",
      "forest_zone",
    );
  }

  start(): void {
    const fixedDt = GAME_CONFIG.CLIENT_TICK_RATE / 1000;
    const _loop = (currentTime: number) => {
      let frameTime = (currentTime - this.lastFrameTime) / 1000;
      if (frameTime > 0.25) frameTime = 0.25;
      this.lastFrameTime = currentTime;
      this.accumulator += frameTime;

      while (this.accumulator >= fixedDt) {
        this.fixedUpdate(fixedDt);
        this.accumulator -= fixedDt;
      }
      this.render();
      requestAnimationFrame(_loop);
    };
    requestAnimationFrame(_loop);
  }

  resetState(): void {
    const lp = this.world.get(this.localPlayerId);
    const dummy = this.world.get("dummy");
    if (lp) {
      lp.health = 100;
      lp.mana = 100;
    }
    if (dummy) {
      dummy.health = 100;
      dummy.mana = 100;
    }
    this.lastKnownServerState[this.localPlayerId].health = 100;
    this.lastKnownServerState[this.localPlayerId].mana = 100;
    this.lastKnownServerState.dummy.health = 100;
    this.lastKnownServerState.dummy.mana = 100;
  }

  fixedUpdate(dt: number): void {
    if (this.renderTime > 0) this.renderTime += dt * 1000;
    this.processLocalInput(dt);
    this.interpolateEntities();
  }

  processLocalInput(dt: number): void {
    this.gamepad.update();
    const context = this.menuManager.currentMenu || "DEFAULT";
    const active = new Set<string>();
    const justPressed = new Set<string>();

    const map = (
      ctrl: KeyboardController | GamepadController,
      type: string,
    ) => {
      const mapping = INPUT_DICTIONARY[context]?.[type];
      if (!mapping) return;
      ctrl.activeKeys.forEach((k) => {
        if (mapping[k]) active.add(mapping[k]);
      });
      ctrl.justPressedKeys.forEach((k) => {
        if (mapping[k]) justPressed.add(mapping[k]);
      });
    };
    map(this.keyboard, "keyboard");
    map(this.gamepad, "gamepad");

    this.virtualInputs.forEach((i) => {
      active.add(i);
      justPressed.add(i);
    });
    this.virtualInputs.clear();

    const isActive = (i: string) => active.has(i);
    const consume = (i: string) => {
      if (justPressed.has(i)) {
        justPressed.delete(i);
        return true;
      }
      return false;
    };

    CommandRegistry.forEach((command) => {
      const action = command(isActive, consume, this);
      if (action) {
        if (action.isLocal && action.execute) {
          action.execute(this);
        } else if (action.type) {
          this.sequenceId++;
          const record: ActionRecord = {
            sequenceId: this.sequenceId,
            type: action.type,
            payload: action.payload || {},
            dt,
          };

          const lp = this.world.get(this.localPlayerId);
          const handler = ActionRegistry.get(record.type);

          if (handler && lp)
            handler.execute(lp, record.payload, dt, this.world);

          this.pendingActions.push(record);
          this.network.send(record);
        }
      }
    });
    this.keyboard.clearJustPressed();
  }

  onNetworkReceive(snapshot: Snapshot): void {
    for (const [id, stateDelta] of Object.entries(snapshot.entitiesDelta)) {
      Object.assign(this.lastKnownServerState[id], stateDelta);
    }

    const lp = this.world.get(this.localPlayerId);
    if (lp) {
      Object.assign(lp, this.lastKnownServerState[this.localPlayerId]);

      // Dynamically pull reconciliation ID mapped specifically to our player entity
      const lastAck = snapshot.lastProcessedIds[this.localPlayerId] || 0;
      this.pendingActions = this.pendingActions.filter(
        (a) => a.sequenceId > lastAck,
      );

      for (const action of this.pendingActions) {
        ActionRegistry.get(action.type)?.reconcile(
          lp,
          action.payload,
          action.dt,
          this.world,
        );
      }
    }

    this.stateBuffer.push({
      serverTime: snapshot.serverTime,
      entities: JSON.parse(JSON.stringify(this.lastKnownServerState)),
    });

    const targetTime = snapshot.serverTime - GAME_CONFIG.INTERPOLATION_DELAY;
    if (this.renderTime === 0 || Math.abs(this.renderTime - targetTime) > 200)
      this.renderTime = targetTime;
    else this.renderTime += (targetTime - this.renderTime) * 0.1;

    while (
      this.stateBuffer.length > 2 &&
      this.stateBuffer[1].serverTime < this.renderTime - 200
    ) {
      this.stateBuffer.shift();
    }
  }

  interpolateEntities(): void {
    if (this.stateBuffer.length < 2) return;
    let s0 = this.stateBuffer[0],
      s1 = this.stateBuffer[this.stateBuffer.length - 1];

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (
        this.stateBuffer[i].serverTime <= this.renderTime &&
        this.stateBuffer[i + 1].serverTime >= this.renderTime
      ) {
        s0 = this.stateBuffer[i];
        s1 = this.stateBuffer[i + 1];
        break;
      }
    }

    const range = s1.serverTime - s0.serverTime;
    const alpha =
      range > 0
        ? Math.max(0, Math.min(1, (this.renderTime - s0.serverTime) / range))
        : 0;

    const dummy = this.world.get("dummy");
    if (dummy) {
      dummy.x =
        s0.entities.dummy.x +
        (s1.entities.dummy.x - s0.entities.dummy.x) * alpha;
      dummy.y =
        s0.entities.dummy.y +
        (s1.entities.dummy.y - s0.entities.dummy.y) * alpha;
      dummy.health = s1.entities.dummy.health;
      dummy.mana = s1.entities.dummy.mana;
    }
  }

  render(): void {
    // ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    // ctx.strokeStyle = "#334155";
    // ctx.lineWidth = 1;
    // for (let i = 0; i < 600; i += 40) {
    //   ctx.beginPath();
    //   ctx.moveTo(i, 0);
    //   ctx.lineTo(i, 400);
    //   ctx.stroke();
    //   ctx.beginPath();
    //   ctx.moveTo(0, i);
    //   ctx.lineTo(600, i);
    //   ctx.stroke();
    // }
    // const srvLocal = server.world.get("localPlayer");
    // const cliDummy = this.world.get("dummy");
    // const cliLocal = this.world.get(this.localPlayerId);
    // if (srvLocal) {
    //   ctx.fillStyle = "#f43f5e";
    //   ctx.beginPath();
    //   ctx.arc(srvLocal.x, srvLocal.y, 14, 0, Math.PI * 2);
    //   ctx.fill();
    // }
    // if (cliDummy) {
    //   ctx.strokeStyle = "#22d3ee";
    //   ctx.fillStyle =
    //     cliDummy.health <= 0
    //       ? "rgba(239, 68, 68, 0.15)"
    //       : "rgba(34, 211, 238, 0.2)";
    //   ctx.lineWidth = 3;
    //   ctx.beginPath();
    //   ctx.arc(cliDummy.x, cliDummy.y, 16, 0, Math.PI * 2);
    //   ctx.fill();
    //   ctx.stroke();
    //   ctx.fillStyle = "#22d3ee";
    //   ctx.font = "10px monospace";
    //   ctx.fillText(
    //     `Target (HP: ${cliDummy.health})`,
    //     cliDummy.x - 40,
    //     cliDummy.y - 25,
    //   );
    // }
    // if (cliLocal && cliDummy) {
    //   if (
    //     performance.now() - cliLocal.lastCastTimestamp < 200 &&
    //     cliDummy.health > 0
    //   ) {
    //     ctx.strokeStyle = "#c084fc";
    //     ctx.lineWidth = 4;
    //     ctx.shadowColor = "#a855f7";
    //     ctx.shadowBlur = 10;
    //     ctx.beginPath();
    //     ctx.moveTo(cliLocal.x, cliLocal.y);
    //     ctx.lineTo(cliDummy.x, cliDummy.y);
    //     ctx.stroke();
    //     ctx.shadowBlur = 0;
    //   }
    //   ctx.strokeStyle = "#34d399";
    //   ctx.fillStyle = "rgba(52, 211, 153, 0.2)";
    //   ctx.lineWidth = 3;
    //   ctx.beginPath();
    //   ctx.arc(cliLocal.x, cliLocal.y, 16, 0, Math.PI * 2);
    //   ctx.fill();
    //   ctx.stroke();
    //   ctx.fillStyle = "#34d399";
    //   ctx.font = "10px monospace";
    //   ctx.textAlign = "center";
    //   ctx.fillText(cliLocal.id, cliLocal.x, cliLocal.y - 28);
    //   ctx.fillText(
    //     `(${Math.round(cliLocal.x)}, ${Math.round(cliLocal.y)})`,
    //     cliLocal.x,
    //     cliLocal.y - 17,
    //   );
    //   ctx.textAlign = "left";
    // }
    // updateUI();
  }
}
