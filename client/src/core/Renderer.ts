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
   * Main viewport render pipeline step. Executed via central Game update tick.
   */
  public render(cameraX: number, cameraY: number) {
    if (!this.canvas || !this.ctx) return;

    const viewWidth = this.canvas.width;
    const viewHeight = this.canvas.height;

    // 1. Clear background array space
    this.ctx.fillStyle = "#11111b";
    this.ctx.fillRect(0, 0, viewWidth, viewHeight);

    if (this.chunkSize === 0) return;

    // 2. Render map assets relative to the current viewport camera parameters
    for (const [key, texture] of this.chunkTextures.entries()) {
      const [chunkX, chunkY] = key.split("_").map(Number);

      const drawX = chunkX * this.chunkSize - cameraX;
      const drawY = chunkY * this.chunkSize - cameraY;

      // Frustum Culling
      if (
        drawX + this.chunkSize < 0 ||
        drawY + this.chunkSize < 0 ||
        drawX > viewWidth ||
        drawY > viewHeight
      ) {
        continue;
      }

      this.ctx.drawImage(texture, drawX, drawY, this.chunkSize, this.chunkSize);
    }
  }
}
