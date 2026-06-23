import type Character from "./Character";
import type Game from "./Game";

export default class Renderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public zoneWebpImage: HTMLImageElement | null = null;
  public playerSprite: HTMLImageElement | null = null;
  private game: any;

  constructor(canvas: HTMLCanvasElement, game: Game) {
    this.game = game;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.loadAssets();
  }

  private loadAssets() {
    // Load map sprite (handled in connection response, but keep reference)
    // Load Player Sprite
    const img = new Image();
    img.src = "/sprites/player.webp";
    img.onload = () => (this.playerSprite = img);
  }

  // Inside Renderer.ts

  /**
   * Master render loop: Clear -> Map -> Character
   */
  public render(): void {
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderZoneMap();
    this.renderCharacter();
  }

  // 🎯 1. Centralize the Camera Math
  private getCameraView() {
    const character = this.game.character;
    const TILE_SIZE = 32;
    const viewportWidth = this.canvas.width;
    const viewportHeight = this.canvas.height;

    const currentX = character?.displayX ?? character?.position?.x ?? 0;
    const currentY = character?.displayY ?? character?.position?.y ?? 0;

    let camTileX = currentX - viewportWidth / TILE_SIZE / 2;
    let camTileY = currentY - viewportHeight / TILE_SIZE / 2;

    // 🎯 Clamp to map bounds so the camera stops when you hit the edge of the world
    if (this.zoneWebpImage) {
      const maxMapTilesX = this.zoneWebpImage.width / TILE_SIZE;
      const maxMapTilesY = this.zoneWebpImage.height / TILE_SIZE;

      if (camTileX + viewportWidth / TILE_SIZE > maxMapTilesX) {
        camTileX = maxMapTilesX - viewportWidth / TILE_SIZE;
      }
      if (camTileY + viewportHeight / TILE_SIZE > maxMapTilesY) {
        camTileY = maxMapTilesY - viewportHeight / TILE_SIZE;
      }
    }

    // Always enforce the absolute zero boundaries
    if (camTileX < 0) camTileX = 0;
    if (camTileY < 0) camTileY = 0;

    return { camTileX, camTileY, currentX, currentY, TILE_SIZE };
  }

  // 🎯 Inside renderZoneMap()
  private renderZoneMap(): void {
    if (!this.zoneWebpImage) return;

    const { camTileX, camTileY, TILE_SIZE } = this.getCameraView();
    const viewportWidth = this.canvas.width;
    const viewportHeight = this.canvas.height;

    // 🎯 FIX: Round the source pixels so the map doesn't vibrate
    const sourceX = Math.round(camTileX * TILE_SIZE);
    const sourceY = Math.round(camTileY * TILE_SIZE);

    this.ctx.drawImage(
      this.zoneWebpImage,
      sourceX,
      sourceY,
      viewportWidth,
      viewportHeight,
      0,
      0,
      viewportWidth,
      viewportHeight,
    );
  }

  // 🎯 Inside renderCharacter()
  private renderCharacter(): void {
    if (!this.game.character) return;

    const { camTileX, camTileY, currentX, currentY, TILE_SIZE } =
      this.getCameraView();

    // 🎯 FIX: Round the final screen placement coordinates
    const screenX = Math.round((currentX - camTileX) * TILE_SIZE);
    const screenY = Math.round((currentY - camTileY) * TILE_SIZE);

    this.ctx.beginPath();
    const centerX = screenX + TILE_SIZE / 2;
    const centerY = screenY + TILE_SIZE / 2;
    const radius = 12;

    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = "#22c55e";
    this.ctx.fill();

    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
}
