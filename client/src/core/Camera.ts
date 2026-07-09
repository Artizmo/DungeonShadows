import type Character from "~/core/Character";

export default class Camera {
  public x = 0;
  public y = 0;

  private readonly TILE_SIZE = 32;

  public update(character: Character, canvas: HTMLCanvasElement): void {
    const playerWorldX = character.renderPosition.x * this.TILE_SIZE;
    const playerWorldY = character.renderPosition.y * this.TILE_SIZE;

    const zoneWidth = 1920 * this.TILE_SIZE;
    const zoneHeight = 896 * this.TILE_SIZE;

    let targetX = playerWorldX - canvas.width / 2;
    let targetY = playerWorldY - canvas.height / 2;

    const maxX = Math.max(0, zoneWidth - canvas.width);
    const maxY = Math.max(0, zoneHeight - canvas.height);

    // Keep these as floats!
    this.x = Math.max(0, Math.min(targetX, maxX));
    this.y = Math.max(0, Math.min(targetY, maxY));
  }
}
