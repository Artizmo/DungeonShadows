import { GameEventType } from "~/core/game/@types";
import type { IRequestHandler, RequestContext } from "~/core/game/@types";

export default class MoveRequest implements IRequestHandler {
  public async execute({ player }: RequestContext): Promise<void> {
    // const { character } = player;
    // character.position.x = character.position.x += data.payload.x;
    // character.position.y = character.position.y += data.payload.y;
    // character.addPendingEvent({
    //   type: GameEventType.CHARACTER,
    //   character,
    //   tick: data.tick,
    // });
  }
}
