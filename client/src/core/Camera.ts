import type Character from "~/core/character/Character";

export default class Camera {
  public x = 0;
  public y = 0;

  private readonly TILE_SIZE = 32;

  public update(
    character: Character,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    const playerWorldX = character.renderPosition.x * this.TILE_SIZE;
    const playerWorldY = character.renderPosition.y * this.TILE_SIZE;

    // Define zone limits (Ideally, these should be passed in via the Zone/World object)
    const zoneWidth = 1920 * this.TILE_SIZE;
    const zoneHeight = 896 * this.TILE_SIZE;

    // Calculate raw target
    let targetX = playerWorldX - canvasWidth / 2;
    let targetY = playerWorldY - canvasHeight / 2;

    // 🟢 CLAMPING LOGIC:
    // If zone is smaller than screen, center the camera, don't allow negative offsets.
    const maxX = Math.max(0, zoneWidth - canvasWidth);
    const maxY = Math.max(0, zoneHeight - canvasHeight);

    targetX = Math.max(0, Math.min(targetX, maxX));
    targetY = Math.max(0, Math.min(targetY, maxY));

    // 🟢 STABILITY FIX: Rounding to integer pixels prevents
    // the "shimmering" effect of rendering images at partial pixel offsets.
    this.x = Math.round(targetX);
    this.y = Math.round(targetY);
  }
}
