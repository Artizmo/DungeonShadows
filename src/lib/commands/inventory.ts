import type { ICommandHandler, CommandContext } from "~/types/game";

export default class CheckInventoryCommand implements ICommandHandler {
  public async execute({ player }: CommandContext): Promise<void> {
    const { character } = player;

    if (!character) {
      player.send({
        type: "ERROR",
        data: { message: "Character not in the world!" },
      });
      return;
    }

    const inventory = character.inventory;
    player.send({ type: "INVENTORY_DATA", data: inventory });
  }
}
