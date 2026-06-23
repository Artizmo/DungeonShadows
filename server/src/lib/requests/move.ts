import { GameEventType } from "~/types/events";
import type { ICommandHandler, CommandContext } from "~/types/game";

export default class MoveCommand implements ICommandHandler {
  public async execute({ player, data }: CommandContext): Promise<void> {
    const { character } = player;

    character.position.x = character.position.x += data.payload.x;
    character.position.y = character.position.y += data.payload.y;

    character.addPendingEvent({
      type: GameEventType.CHARACTER,
      character,
    });
  }
}
