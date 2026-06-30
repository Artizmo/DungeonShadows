import { Deserialize } from "~/shared/serialize/deserializer";
import Character from "~/core/character/Character";
import type { IResponseHandler, ResponseContext } from "~/core/game/@types";
import type Game from "~/core/game/Game";

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
        console.log("🟢 bingo c! Packet successfully unlocked:", payload);
        console.log(
          "🔢 Server confirmed processing up to sequence:",
          lastSequence,
        );

        const localChar = this.game.world.character;
        if (!localChar) return;

        if (payload.characterId === localChar.id) {
          // Trigger reconciliation
          localChar.reconcile(payload.x, payload.y, lastSequence);
        }
      },
    });
  }
}
