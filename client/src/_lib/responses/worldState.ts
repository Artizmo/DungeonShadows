import { Deserialize } from "~/shared/serialize/deserializer";
import Character from "~/core/Character";
import type { IResponseHandler, ResponseContext } from "~/core/types";
import type Game from "~/core/Game";
import { MoveAction } from "~/shared/actions/movement";

[]; // find a way to clean up this file.

export default class WorldStateResponse implements IResponseHandler {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  public async execute({ data }: ResponseContext): Promise<void> {
    Deserialize.packet(data, {
      onEntitySpawn: (character) => {
        this.game.world.character = new Character(character);
        this.game.events.emit("CHARACTER_UPDATE", character);
      },

      onMapChunk: (map) => {
        this.game.renderer!.loadMap(map);
      },

      // 🟢 THE RECONCILIATION HOOK
      onMoveVerified: (payload, lastSequence) => {
        const localChar = this.game.world.character;
        if (!localChar) return;

        if (payload.characterId === localChar.id) {
          // Trigger reconciliation
          MoveAction.reconcile(
            payload,
            {
              character: localChar,
              world: this.game.world,
              game: this.game,
            },
            lastSequence,
          );
        }
      },
    });
  }
}
