// client/src/core/render/Camera.ts
import type Character from "~/core/character/Character";
import type Zone from "~/core/world/Zone";

export default class Camera {
  public x = 0;
  public y = 0;

  private readonly TILE_SIZE = 32;

  /**
   * Centers the viewport on the player and locks onto the active zone boundaries
   */
  public update(
    character: Character,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    // 1. 🟢 FIX: Transform character smooth render positions into world space pixels
    const playerWorldX = character.renderX * this.TILE_SIZE;
    const playerWorldY = character.renderY * this.TILE_SIZE;

    // 2. Find total width and height boundaries of the active layout zone
    const maxZoneWidthPixels = 1920 * this.TILE_SIZE;
    const maxZoneHeightPixels = 896 * this.TILE_SIZE;

    // 3. Center the screen target directly over our character's pivot point
    const targetCamX = playerWorldX - canvasWidth / 2;
    const targetCamY = playerWorldY - canvasHeight / 2;

    // 4. Boundary Locking Clamps: Stop viewport scrolling at room borders
    this.x = Math.max(
      0,
      Math.min(targetCamX, maxZoneWidthPixels - canvasWidth),
    );
    this.y = Math.max(
      0,
      Math.min(targetCamY, maxZoneHeightPixels - canvasHeight),
    );
  }
}
