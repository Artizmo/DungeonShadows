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
        // 🟢 Revert to plain object destructuring since your Deserializer handles the getters!
        const { w, s, a, d } = data;
        console.log(
          `📥 Server received keys -> W: ${w}, S: ${s}, A: ${a}, D: ${d}`,
        );
        const moveSpeed = this.character.speed ?? 0.06;

        if (w) this.character.position.y -= moveSpeed;
        if (s) this.character.position.y += moveSpeed;
        if (a) this.character.position.x -= moveSpeed;
        if (d) this.character.position.x += moveSpeed;

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

        // 🟢 Keep this log active to watch the coordinates change!
        Log.SERVER.INFO(
          `🟢 Phase 3 Complete | Player: ${this.character.id} | ` +
            `Processed Input Sequence ID: ${sequenceId} | ` +
            `Authoritative Position: (${this.character.position.x.toFixed(2)}, ${this.character.position.y.toFixed(2)})`,
        );

        this.game.activeCharacters.set(this.character.id, this.character);
      },
    });
  }
}
