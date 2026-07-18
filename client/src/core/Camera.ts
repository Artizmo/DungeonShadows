import type Character from "~/core/Character";

export default class Camera {
  public x = 0;
  public y = 0;

  public update(character: Character, canvas: HTMLCanvasElement): void {
    if (!canvas) return;

    const viewWidth = canvas.width;
    const viewHeight = canvas.height;

    const zoneWidth = character.zone.map.width;
    const zoneHeight = character.zone.map.height;

    // 🟢 Centering Logic:
    // If the window is larger than the map, we center the map.
    // Otherwise, we pan normally.
    const targetX = character.renderPosition.x - viewWidth / 2;
    const targetY = character.renderPosition.y - viewHeight / 2;

    // If map is smaller than view, force it to the center (offset = (view - zone) / 2)
    const offsetX = Math.max(0, (viewWidth - zoneWidth) / 2);
    const offsetY = Math.max(0, (viewHeight - zoneHeight) / 2);

    // Updated limits
    const minX = Math.min(0, offsetX);
    const minY = Math.min(0, offsetY);
    const maxX = Math.max(minX, zoneWidth - viewWidth + offsetX);
    const maxY = Math.max(minY, zoneHeight - viewHeight + offsetY);

    this.x = Math.max(minX, Math.min(targetX, maxX));
    this.y = Math.max(minY, Math.min(targetY, maxY));
  }
}
