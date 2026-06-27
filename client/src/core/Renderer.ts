// client/src/core/render/Renderer.ts
import type { IMapChunkData } from "~/shared/serialize/@types";

export default class Renderer {
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;
  private chunkTextures: Map<string, HTMLImageElement> = new Map();
  private chunkSize: number = 0;

  private readonly TILE_SIZE = 32;
  private readonly MAX_WIDTH = 1920;
  private readonly MAX_HEIGHT = 896;

  /**
   * 🟢 Safe getter for current buffer width
   */
  public get width(): number {
    return this.canvas ? this.canvas.width : 0;
  }

  /**
   * 🟢 Safe getter for current buffer height
   */
  public get height(): number {
    return this.canvas ? this.canvas.height : 0;
  }

  /**
   * Safe binding method invoked by React component mounts/resizes.
   * Forces the canvas dimensions to cleanly divide into 32px increments.
   */
  public bind(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    const browserWidth = window.innerWidth;
    const browserHeight = window.innerHeight;

    // 1. Enforce maximal hard boundaries
    const clampedWidth = Math.min(browserWidth, this.MAX_WIDTH);
    const clampedHeight = Math.min(browserHeight, this.MAX_HEIGHT);

    // 2. 🟢 THE SNAP FORMULA: Drop partial edge fragments by grounding into multiple structural tiles
    // e.g. 1875 max cap drops down cleanly to 1856 (58 columns * 32px)
    const snappedWidth =
      Math.floor(clampedWidth / this.TILE_SIZE) * this.TILE_SIZE;
    const snappedHeight =
      Math.floor(clampedHeight / this.TILE_SIZE) * this.TILE_SIZE;

    this.canvas.width = snappedWidth;
    this.canvas.height = snappedHeight;

    // 3. Keep rendering pixels crisp and aliased
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
      (this.ctx as any).mozImageSmoothingEnabled = false;
      (this.ctx as any).webkitImageSmoothingEnabled = false;
      (this.ctx as any).msImageSmoothingEnabled = false;
    }

    console.log(
      `📐 Canvas locked seamlessly to grid lines: ${snappedWidth}x${snappedHeight} (${snappedWidth / 32}x${snappedHeight / 32} cells)`,
    );
  }

  /**
   * Converts raw FlatBuffer bytes concurrently into cached GPU image objects.
   */
  public loadMap(chunk: IMapChunkData) {
    const chunkKey = `${chunk.x}_${chunk.y}`;
    if (this.chunkTextures.has(chunkKey)) return;

    const blob = new Blob([chunk.imageBytes], { type: "image/webp" });
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.src = objectUrl;

    img.onload = () => {
      if (this.chunkSize === 0 && img.width > 0) {
        this.chunkSize = img.width;
        console.log(
          `📏 Auto-detected map chunk spacing scale: ${this.chunkSize}px`,
        );
      }
      this.chunkTextures.set(chunkKey, img);
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      console.error(
        `❌ Failed to decode texture bytes for chunk layout ${chunkKey}`,
      );
      URL.revokeObjectURL(objectUrl);
    };
  }

  /**
   * Draws an active character sprite onto the screen, relative to the camera viewport.
   */
  public renderCharacter(
    character: any,
    cameraX: number,
    cameraY: number,
  ): void {
    if (!this.canvas || !this.ctx) return;

    // 1. Convert the character's grid position into world pixels
    const worldX = character.position.x * this.TILE_SIZE;
    const worldY = character.position.y * this.TILE_SIZE;

    // 2. Translate world pixels into screen-space drawing coordinates
    const drawX = worldX - cameraX;
    const drawY = worldY - cameraY;

    // Frustum Culling: Skip drawing if the character is entirely off-screen
    if (
      drawX + this.TILE_SIZE < 0 ||
      drawY + this.TILE_SIZE < 0 ||
      drawX > this.canvas.width ||
      drawY > this.canvas.height
    ) {
      return;
    }

    // 3. 🟢 THE GREEN VELVET CIRCLE
    // Calculate the center point of the tile and the circle's radius
    const radius = this.TILE_SIZE / 2;
    const centerX = drawX + radius;
    const centerY = drawY + radius;

    this.ctx.beginPath();
    // arc(x, y, radius, startAngle, endAngle) -> Math.PI * 2 makes a full 360 degree circle
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    // Set fill to a rich, deep forest velvet green
    this.ctx.fillStyle = "#1b4d3e";
    this.ctx.fill();

    // Draw a crisp, slightly darker outline border around the velvet circle so it pops on dark tiles
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  public render(cameraX: number, cameraY: number) {
    if (!this.canvas || !this.ctx) return;

    const viewWidth = this.canvas.width;
    const viewHeight = this.canvas.height;

    // 1. Reset background
    this.ctx.fillStyle = "#11111b";
    this.ctx.fillRect(0, 0, viewWidth, viewHeight);

    if (this.chunkSize === 0) return;

    // 2. Loop through loaded binary chunks
    for (const [key, texture] of this.chunkTextures.entries()) {
      const [chunkX, chunkY] = key.split("_").map(Number);

      // Coordinate translation based on our base chunk sizing scale
      const drawX = chunkX * this.chunkSize - cameraX;
      const drawY = chunkY * this.chunkSize - cameraY;

      // 🟢 DYNAMIC FRUSTUM CULLING: Use the texture's actual size for the boundary check
      if (
        drawX + texture.width < 0 ||
        drawY + texture.height < 0 ||
        drawX > viewWidth ||
        drawY > viewHeight
      ) {
        continue;
      }

      // 🟢 THE FIX: Render with native width and height instead of forcing this.chunkSize twice
      this.ctx.drawImage(texture, drawX, drawY, texture.width, texture.height);
    }
  }
}
