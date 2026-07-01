import type Character from "~/core/character/Character";
import {
  GameEventType,
  type IRequestHandler,
  type MoveEvent,
  type RequestContext,
} from "~/core/game/types";
import type Game from "~/core/game/Game";
import { Log } from "~/shared/core/Logger";
import { Deserialize } from "~/shared/serialize/deserializer";

export default class BatchInputRequest implements IRequestHandler {
  private game: Game;
  private character: Character;

  constructor(game: Game, character: Character) {
    this.game = game;
    this.character = character;
  }

  public async execute({ data }: RequestContext): Promise<void> {
    if (!data) return;

    Deserialize.packet(data, {
      onMoveInput: async (data, sequenceId) => {
        const { w, s, a, d, deltaTime } = data;

        // 🟢 1. Use your character's actual base speed property (e.g., 100 or 5)
        // Fall back to a standard baseline if undefined, NOT a pre-multiplied 0.06
        const baseSpeed = this.character.speed ?? 3.6;

        // 🟢 2. Calculate actual distance using the client's real frame duration slice!
        // If deltaTime is somehow missing, fall back safely to 1/60
        const distance = baseSpeed * (deltaTime ?? 1 / 60);

        // 🟢 3. Apply the time-scaled distance
        if (w) this.character.position.y -= distance;
        if (s) this.character.position.y += distance;
        if (a) this.character.position.x -= distance;
        if (d) this.character.position.x += distance;

        // Phase 3.4: Sequence Acknowledgment
        this.character.lastProcessedId = sequenceId;

        const moveEvent: MoveEvent = {
          type: GameEventType.MOVE,
          characterId: this.character.id,
          x: this.character.position.x,
          y: this.character.position.y,
          lastProcessedId: sequenceId,
        };

        this.character.addPendingEvent(moveEvent);

        Log.SERVER.INFO(
          `🟢 Player: ${this.character.id} | Seq: ${sequenceId} | Pos: (${this.character.position.x.toFixed(2)}, ${this.character.position.y.toFixed(2)})`,
        );

        this.game.activeCharacters.set(this.character.id, this.character);
      },
    });
  }
}
