import { Deserialize } from "~/shared/serialize/deserializer";
import type { IResponseHandler, ResponseContext } from "~/core/game/@types";
import Character, { type ICharacter } from "~/core/character/Character";
import { c } from "node_modules/vite/dist/node/moduleRunnerTransport.d-DJ_mE5sf";

export default class WorldStateResponse implements IResponseHandler {
  public async execute({
    character,
    data,
    game,
  }: ResponseContext): Promise<void> {
    if (!character) return;

    const events = Deserialize.worldState(data);

    // 1. Find the specific update matching this local player instance
    const myUpdate = events.find((event) => event.characterId === character.id);
    if (!myUpdate) return;

    // 2. 🟢 Step 1: Ground Truth Override
    // Instantly snap coordinates to the server's authoritative position
    character.position.x = myUpdate.x;
    character.position.y = myUpdate.y;

    // 3. 🟢 Step 2: The O(A) Pluck
    // Discard all pending inputs that the server has already confirmed and processed
    const serverLastProcessedId = myUpdate.lastProcessedId;

    while (
      character.pendingActions.length > 0 &&
      character.pendingActions[0].sequenceId <= serverLastProcessedId
    ) {
      character.pendingActions.shift(); // Remove the acknowledged action from the head of the queue
    }

    // 4. 🟢 Step 3: Re-Simulation Pass
    // Re-apply any unacknowledged inputs that happened while the packet was traveling
    for (const action of character.pendingActions) {
      if (action.payload.w) character.position.y -= character.speed;
      if (action.payload.s) character.position.y += character.speed;
      if (action.payload.a) character.position.x -= character.speed;
      if (action.payload.d) character.position.x += character.speed;
    }
  }
}
