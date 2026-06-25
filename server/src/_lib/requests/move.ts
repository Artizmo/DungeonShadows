import { GameEventType } from "~/core/game/@types";
import type { ICommandHandler, CommandContext } from "~/core/game/@types";

export default class MoveCommand implements ICommandHandler {
  public async execute({ player, data }: CommandContext): Promise<void> {
    const { character } = player;

    character.position.x = character.position.x += data.payload.x;
    character.position.y = character.position.y += data.payload.y;

    character.addPendingEvent({
      type: GameEventType.CHARACTER,
      character,
      tick: data.tick,
    });
  }
}
