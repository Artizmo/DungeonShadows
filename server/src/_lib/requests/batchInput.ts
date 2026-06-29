import * as flatbuffers from "flatbuffers";
import {
  GameEventType,
  type IRequestHandler,
  type MoveEvent,
  type RequestContext,
} from "~/core/game/@types";
import type Game from "~/core/game/Game";
import { Log } from "~/shared/core/Logger";
import { ActionPayload } from "~/shared/serialize/generated/game-protocol/action-payload";
import { ClientBatchPacket } from "~/shared/serialize/generated/game-protocol/client-batch-packet";
import { MovePayload } from "~/shared/serialize/generated/game-protocol/move-payload";

// 1. Import your generated FlatBuffer classes (Adjust relative path if necessary)
// import { ClientBatchPacket } from "../generated/game-protocol/client-batch-packet.js";
// import { ActionPayload } from "../generated/game-protocol/action-payload.js";
// import { MovePayload } from "../generated/game-protocol/move-payload.js";

export default class BatchInputRequest implements IRequestHandler {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  public async execute({ character, data }: RequestContext): Promise<void> {
    // Ensure data exists and is a valid binary block
    if (!data || !(data instanceof Uint8Array)) return;

    // 2. Initialize the FlatBuffer ByteBuffer reader
    const buf = new flatbuffers.ByteBuffer(data);
    const batch = ClientBatchPacket.getRootAsClientBatchPacket(buf);

    const actionsLength = batch.actionsLength();

    // 3. Chronologically loop through every action inside the batch
    for (let i = 0; i < actionsLength; i++) {
      const actionData = batch.actions(i);
      if (!actionData) continue;

      const sequenceId = actionData.sequenceId();
      const payloadType = actionData.payloadType();

      // Phase 3.1 & 3.2: Deserialization & Routing to Union Type
      if (payloadType === ActionPayload.MovePayload) {
        const movePayload = new MovePayload();
        actionData.payload(movePayload);

        // Extract the raw structural booleans from binary memory
        const w = movePayload.w();
        const s = movePayload.s();
        const a = movePayload.a();
        const d = movePayload.d();

        // Phase 3.3: Authoritative State Mutation (Physics & Collision checks go here)
        // Adjust these lines to match your server-side character properties/speed constants
        const moveSpeed = character.speed || 4;

        if (w) character.position.y -= moveSpeed;
        if (s) character.position.y += moveSpeed;
        if (a) character.position.x -= moveSpeed;
        if (d) character.position.x += moveSpeed;

        // Phase 3.4: Sequence Acknowledgment
        // We stamp the character with the absolute latest input ID processed
        character.lastProcessedId = sequenceId;

        const moveEvent: MoveEvent = {
          type: GameEventType.MOVE,
          characterId: character.id,
          x: character.position.x,
          y: character.position.y,
          lastProcessedId: sequenceId,
        };

        character.addPendingEvent(moveEvent);
      }

      // Future expansion:
      // else if (payloadType === ActionPayload.InventoryTogglePayload) { ... }
    }
    Log.SERVER.INFO(
      `🟢 Phase 3 Complete | Player: ${character.id} | ` +
        `Batched Inputs Processed: ${actionsLength} | ` +
        `Last Processed ID: ${character.lastProcessedId} | ` +
        `Authoritative Position: (${character.position.x}, ${character.position.y})`,
    );

    this.game.activeCharacters.set(character.id, character);
  }
}
