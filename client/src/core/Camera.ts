import type Character from "~/core/Character";

export default class Camera {
  public x = 0;
  public y = 0;

  public update(character: Character, canvas: HTMLCanvasElement): void {
    const playerWorldX = character.renderPosition.x;
    const playerWorldY = character.renderPosition.y;

    // Direct pixel sizes for maximum zone clamping boundaries
    const zoneWidth = 61440;
    const zoneHeight = 28672;

    let targetX = playerWorldX - canvas.width / 2;
    let targetY = playerWorldY - canvas.height / 2;

    const maxX = Math.max(0, zoneWidth - canvas.width);
    const maxY = Math.max(0, zoneHeight - canvas.height);

    // Keep camera coordinates floating for buttery-smooth lerp steps
    this.x = Math.max(0, Math.min(targetX, maxX));
    this.y = Math.max(0, Math.min(targetY, maxY));
  }
}
