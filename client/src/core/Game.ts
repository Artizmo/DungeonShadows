import World from "~/core/World";
import Camera from "~/core/Camera";
import GamepadController from "~/core/GamepadController";
import KeyboardController from "~/core/KeyboardController";
import { Serialize } from "~/shared/network/serialize";
import { ActionRegistry } from "./actions";
import type EventEmitter from "eventemitter3";
import type Loop from "~/core/Loop";
import type Renderer from "~/core/Renderer";
import type Network from "~/core/Network";
import {
  actionDictionary,
  inputDictionary,
} from "~/core/commands/input-dictionary";
import { CommandType } from "~/core/commands/index";
import { ActionType, PacketCategory } from "~/shared/core/types";
import type { WorldState } from "./types";

export default class Game {
  events: EventEmitter;
  loop: Loop;
  network: Network;
  world: World;
  renderer: Renderer;
  camera: Camera = new Camera();
  gamepad: GamepadController;
  keyboard: KeyboardController;
  sequenceId = 0;
  private activeCommands = new Set<CommandType>();
  private inputHistory: Array<{
    // move to character class
    sequenceId: number;
    tick: number;
    action: ActionType;
    activeCommands: Set<CommandType>;
  }> = [];
  // private stateHistory: Array<{
  //   // move to world class
  //   sequenceId: number;
  //   tick: number;
  //   actions: Set<ActionType>;
  //   state: WorldState;
  // }> = [];
  private readonly DELTA_TIME = 1 / 20;
  private readonly MAX_INPUT_HISTORY = 10;

  constructor(
    world: World,
    renderer: Renderer,
    loop: Loop,
    network: Network,
    events: EventEmitter,
    gamepad: GamepadController,
    keyboard: KeyboardController,
  ) {
    this.events = events;
    this.world = world;
    this.renderer = renderer;
    this.loop = loop;
    this.network = network;
    this.gamepad = gamepad;
    this.keyboard = keyboard;

    this.loop.onUpdate = (alpha: number) => this.update(alpha);
    this.loop.onTick = (tick: number) => this.tick(tick);
  }

  update(alpha: number): void {
    if (!this.world.character) return;

    const { character } = this.world;
    const { position, prevPosition, renderPosition } = character;

    // 🟢 Calculate final render position: standard LERP
    renderPosition.x = prevPosition.x + (position.x - prevPosition.x) * alpha;
    renderPosition.y = prevPosition.y + (position.y - prevPosition.y) * alpha;

    this.camera.update(character, this.renderer.canvas!);
    this.renderer.render(character, this.camera);
  }

  tick(tick: number): void {
    if (this.world.character) {
      this.events.emit("game_update");
      this.world.character.tick(tick);
      this.processInputs();
    }

    while (this.network.packetQueue.length > 0) {
      const packet = this.network.packetQueue.shift();
      if (!packet) continue;

      const data = Serialize.decode(packet);

      if (data.category === PacketCategory.SNAPSHOT) {
        this.handleServerReconciliation(data);
      } else {
        const handler = ActionRegistry.get(data.actionType);
        const { character } = this.world;
        handler?.execute({ data, character, game: this });
      }
    }
  }

  private handleServerReconciliation(serverData: any): void {
    if (!this.world.character) return;

    const { character } = this.world;

    while (
      this.inputHistory.length > 0 &&
      (this.inputHistory[0].sequenceId <= serverData.lastProcessedSequenceId ||
        this.inputHistory.length > this.MAX_INPUT_HISTORY)
    ) {
      this.inputHistory.shift();
    }

    // 2. 🟢 CACHE ORIGINAL PREDICTION STATES
    // Capture where the renderer currently thinks we are before any coordinate modifications
    // const oldPredictedX = character.position.x;
    // const oldPredictedY = character.position.y;

    // 3. Teleport local character to the absolute authoritative server baseline
    character.position.x = serverData.playerState.x;
    character.position.y = serverData.playerState.y;

    // 4. REPLAY all inputs that are still outstanding (not yet processed by server)
    for (const savedInput of this.inputHistory) {
      const dataContext = {
        activeCommands: savedInput.activeCommands,
        speed: character.speed,
        deltaTime: this.DELTA_TIME,
      };

      const handler = ActionRegistry.get(savedInput.action);
      if (handler) {
        handler.execute({ data: dataContext, character, game: this });
      }
    }
  }

  processInputs(): void {
    const { character } = this.world;
    const keyboard = this.keyboard.activeKeys;
    const gamepad = this.gamepad.activeKeys;
    const context = "DEFAULT";
    const actionTypeQueue: Set<ActionType> = new Set();

    this.activeCommands.clear();
    this.gamepad.update();

    const inputControls = [
      { input: keyboard, command: inputDictionary[context]?.["keyboard"] },
      { input: gamepad, command: inputDictionary[context]?.["gamepad"] },
    ];

    inputControls.forEach(({ input, command }) => {
      if (!command) return;

      const uniqueInputs = new Set(input);

      for (const k of uniqueInputs) {
        const cmd = command[k];
        if (cmd) {
          this.activeCommands.add(cmd);
        }
      }
    });

    for (const type of this.activeCommands) {
      const actionType = actionDictionary[type];
      if (actionType) actionTypeQueue.add(actionType);
    }

    for (const action of actionTypeQueue) {
      this.sequenceId++;
      this.inputHistory.push({
        sequenceId: this.sequenceId,
        tick: this.loop.tick,
        action,
        activeCommands: new Set(this.activeCommands),
      });
    }

    // 🟢 Only run prediction if there are actual actions to simulate
    if (actionTypeQueue.size > 0) {
      for (const actionType of actionTypeQueue) {
        const handler = ActionRegistry.get(actionType);
        if (!handler) continue;

        const FIXED_DELTA = 1 / 20;
        handler.execute({
          data: {
            activeCommands: this.activeCommands,
            speed: character.speed,
            deltaTime: FIXED_DELTA,
          },
          character,
          game: this,
        });
      }
    }

    // 🟢 Always tell the server our latest sequenceId, even if actions array is empty []
    this.network.send(
      Serialize.action({
        characterId: character.id,
        sequenceId: this.sequenceId,
        tick: this.loop.tick,
        actions: Array.from(actionTypeQueue),
        activeCommands: Array.from(this.activeCommands),
      }),
    );

    // this.stateHistory.push({
    //   sequenceId: this.sequenceId,
    //   tick: this.loop.tick,
    //   actions: new Set(actionTypeQueue),
    //   state: {
    //     character: {
    //       stats: { ...character.stats },
    //       position: { ...character.position },
    //     },
    //   },
    // });

    // if (this.stateHistory.length > 15) {
    //   this.stateHistory.shift();
    // }
  }

  start(ticket: string): void {
    this.loop.start();
    this.network.connect(ticket);
  }

  handleBindCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas) return;

    this.renderer.bind(canvas);
  }
}
