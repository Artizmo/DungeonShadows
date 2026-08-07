import World from "~/core/World";
import Camera from "~/core/Camera";
import GamepadController from "~/core/GamepadController";
import KeyboardController from "~/core/KeyboardController";
import { Serialize } from "~/shared/core/serialize";
import { ActionRegistry } from "./handlers";
import type EventEmitter from "eventemitter3";
import type Loop from "~/core/Loop";
import type Renderer from "~/core/Renderer";
import type Network from "~/core/Network";
import {
  actionDictionary,
  inputDictionary,
} from "~/core/utils/input-dictionary";
import { CommandType } from "~/core/utils/input-dictionary";
import { ActionType, PacketCategory } from "~/shared/core/types";
import type { StateManager } from "~/core/StateManager";
import { EntityInterpolator } from "./EntityInterpolator";
import Zone from "./Zone";
import Character from "./Character";

export default class Game {
  // --- Core ---
  public readonly events: EventEmitter;
  public readonly loop: Loop;
  public readonly network: Network;
  public readonly world: World;
  public readonly renderer: Renderer;
  public readonly camera: Camera = new Camera();
  public readonly stateManager: StateManager;

  // --- Controllers ---
  public readonly gamepad: GamepadController;
  public readonly keyboard: KeyboardController;

  // --- State ---
  public sequenceId = 0;
  private readonly interpolator = new EntityInterpolator();
  private readonly activeCommands = new Set<CommandType>();
  private readonly MAX_INPUT_HISTORY = 10;

  constructor(
    world: World,
    renderer: Renderer,
    loop: Loop,
    network: Network,
    events: EventEmitter,
    gamepad: GamepadController,
    keyboard: KeyboardController,
    stateManager: StateManager
  ) {
    this.world = world;
    this.renderer = renderer;
    this.loop = loop;
    this.network = network;
    this.events = events;
    this.gamepad = gamepad;
    this.keyboard = keyboard;
    this.stateManager = stateManager;

    this.loop.onUpdate = (alpha: number) => this.update(alpha);
    this.loop.onTick = () => this.tick();
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  public start(ticket: string): void {
    this.loop.start();
    this.network.connect(ticket);
  }

  public tick(): void {
    if (!this.world.character) return;

    this.events.emit("game_update");
    this.world.character.tick();
    this.processInputs();
  }

  public update(alpha: number): void {
    // 1. Drain network queues first
    this.processPackets();

    // 2. Guard: Ensure local character exists before rendering
    const { character } = this.world;
    if (
      !character?.position ||
      !character?.prevPosition ||
      !character?.renderPosition
    ) {
      return;
    }

    // 3. Interpolation
    const { position, prevPosition, renderPosition } = character;
    renderPosition.x = prevPosition.x + (position.x - prevPosition.x) * alpha;
    renderPosition.y = prevPosition.y + (position.y - prevPosition.y) * alpha;

    this.interpolator.interpolate(this.world.entities, 135);

    // 4. Render
    this.camera.update(character, this.renderer.canvas!);
    this.renderer.render(character, this.camera, this.world.entities);
  }

  // ==========================================================================
  // INPUT & PREDICTION
  // ==========================================================================

  private processInputs(): void {
    const { character } = this.world;
    if (!character) return;

    this.activeCommands.clear();
    this.gamepad.update();

    const context = "DEFAULT";
    const actionTypeQueue = new Set<ActionType>();

    // 1. Map raw inputs to commands
    this.mapInputsToCommands(
      this.keyboard.activeKeys,
      inputDictionary[context]?.["keyboard"]
    );
    this.mapInputsToCommands(
      this.gamepad.activeKeys,
      inputDictionary[context]?.["gamepad"]
    );

    // 2. Map commands to actions
    for (const command of this.activeCommands) {
      const actionType = actionDictionary[command];
      if (actionType) actionTypeQueue.add(actionType);
    }

    // 3. Save to history for reconciliation
    this.sequenceId++;
    const activeCommandsSnap = new Set(this.activeCommands);

    for (const action of actionTypeQueue) {
      character.pendingActions.push({
        sequenceId: this.sequenceId,
        tick: this.loop.tick,
        action,
        activeCommands: activeCommandsSnap,
      });
    }

    // 4. Client-side prediction (execute locally)
    if (actionTypeQueue.size > 0) {
      for (const actionType of actionTypeQueue) {
        ActionRegistry.get(actionType)?.handle({
          data: {
            activeCommands: this.activeCommands,
            tickRate: this.loop.tickRate,
          },
          game: this,
        });
      }
    }

    // 5. Send to server
    this.network.send(
      Serialize.action({
        characterId: character.id,
        sequenceId: this.sequenceId,
        tick: this.loop.tick,
        actions: Array.from(actionTypeQueue),
        activeCommands: Array.from(this.activeCommands),
      })
    );
  }

  private mapInputsToCommands(
    activeKeys: Set<string>,
    dictionary?: Record<string, CommandType>
  ): void {
    if (!dictionary) return;
    for (const key of activeKeys) {
      const command = dictionary[key];
      if (command) this.activeCommands.add(command);
    }
  }

  // ==========================================================================
  // NETWORK & STATE SYNC
  // ==========================================================================

  private processPackets(): void {
    while (this.network.packetQueue.length > 0) {
      const packet = this.network.packetQueue.shift();
      if (!packet) continue;

      try {
        const data = Serialize.decode(packet);
        if (!data) continue;

        if (data.actionType) {
          ActionRegistry.get(data.actionType)?.handle({
            data,
            character: this.world.character,
            game: this,
          });
        }

        if (data.category === PacketCategory.SNAPSHOT) {
          this.handleSnapshot(data);
        }
      } catch (err) {
        console.error("Error processing packet:", err);
      }
    }
  }

  private handleSnapshot(data: any): void {
    // 🟢 1. Bootstrapping / Initial Spawn

    console.log("bingo data", data);
    if (!this.world.character) {
      this.handleInitialSpawn(data);
      return;
    }

    // 🟢 2. Streaming Updates (Regular Tick)
    // Update streaming chunks if present
    if (data.chunks || data.unchunks) {
      this.renderer.loadMap(data.chunks, data.unchunks);
    }

    // Process remote entities & reconcile local state
    if (Array.isArray(data.entities)) {
      this.processEntityDeltas(data.entities);
    }

    this.handleServerReconciliation(data);
    this.events.emit("game_update");
  }

  private handleInitialSpawn(data: any): void {
    const { chunks, unchunks, entities } = data;

    // 1. Setup Character and Zone
    const character = new Character(data.character);
    const zone = new Zone(data.character.zoneId);
    this.world.areas.get(zone.areaId)?.addZone(zone);
    this.world.add(character);

    // Explicitly set the local reference for the Game loop guard
    this.world.character = character;

    // 2. Load map textures into the renderer's cache
    this.renderer.loadMap(chunks, unchunks);

    // 3. Store the baseline entities in your client's World state
    this.world.entities.clear();
    if (entities?.length > 0) {
      for (const entity of entities) {
        this.world.entities.set(entity.id, entity);
      }
    }

    // Notify UI/Camera that the local player is ready
    this.events.emit("character_spawned", this.world.character);
  }

  private processEntityDeltas(entities: any[]): void {
    const localPlayerId = String(this.world.character?.id);
    const now = performance.now();

    for (const delta of entities) {
      // Skip local player delta to prevent input fighting
      if (localPlayerId !== "undefined" && String(delta.id) === localPlayerId) {
        continue;
      }

      let entity = this.world.entities.get(delta.id);

      if (!entity) {
        entity = {
          id: delta.id,
          name: delta.name,
          level: delta.level,
          type: delta.type,
          position: delta.position
            ? { x: delta.position.x, y: delta.position.y }
            : { x: 0, y: 0 },
          width: delta.width ?? 32,
          height: delta.height ?? 32,
        };
        this.world.entities.set(delta.id, entity);
      }

      if (delta.position) {
        this.interpolator.pushSnapshot(
          delta.id,
          delta.position.x,
          delta.position.y,
          now
        );
      }
    }
  }

  private handleServerReconciliation(serverData: any): void {
    const { character } = this.world;
    if (!character) return;

    // 1. Purge acknowledged inputs
    while (
      character.pendingActions.length > 0 &&
      (character.pendingActions[0].sequenceId <=
        serverData.lastProcessedSequenceId ||
        character.pendingActions.length > this.MAX_INPUT_HISTORY)
    ) {
      character.pendingActions.shift();
    }

    // 2. Apply baseline server state
    const localCharDelta = serverData.entities?.find(
      (e: any) => String(e.id) === String(character.id)
    );
    if (!localCharDelta) return;

    this.stateManager.setState(character, localCharDelta);

    // 3. Replay unacknowledged actions
    for (const savedInput of character.pendingActions) {
      ActionRegistry.get(savedInput.action)?.handle({
        data: {
          activeCommands: savedInput.activeCommands,
          tickRate: this.loop.tickRate,
        },
        character,
        game: this,
      });
    }

    // 4. Smooth discrepancy
    this.stateManager.reconcile(character);
  }

  // ==========================================================================
  // UTILS
  // ==========================================================================

  public handleBindCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas) return;

    if (this.world.character) {
      this.world.character.cameraWidth = canvas.width;
      this.world.character.cameraHeight = canvas.height;
    }
    this.renderer.bind(canvas);
  }
}
