import type { ICommandHandler, CommandContext } from "~/types/game";

export default class ScoreCommand implements ICommandHandler {
  execute({ player }: CommandContext): void {
    const { character } = player;

    if (!character) {
      player.send({ type: "SCORE_FAIL", data: "You do not have a character loaded." });
      return;
    }

    const effectList = character.activeEffects.size > 0
      ? Array.from(character.activeEffects.values())
          .map(e => `${e.type} (Charges: ${e.duration}, Dens: ${e.density})`)
          .join(", ")
      : "None";

    const statusOutput = [
      `\n----------------------------------------`,
      ` CHARACTER SCORE: ${character.name.toUpperCase()}`,
      `----------------------------------------`,
      ` HP      : ${character.stats.hp} / ${character.stats.maxHp}`,
      ` Position: X: ${character.position.x}, Y: ${character.position.y}`,
      ` Effects : ${effectList}`,
      ` Storage : ${character.inventory.length} items holding`,
      `----------------------------------------`
    ].join("\n");

    player.send({
      type: "SCORE_SUCCESS",
      data: statusOutput
    });
  }
}