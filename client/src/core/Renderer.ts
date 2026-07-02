import type { IMapChunk } from "./actions/types";
import type Character from "./Character";

export interface ICamera {
  x: number;
  y: number;
}

// 🟢 Pre-define the structure for cached textures
interface IChunkTexture {
  x: number;
  y: number;
  img: HTMLImageElement;
}

export default class Renderer {
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;

  // 🟢 Optimized store: Map strings to pre-parsed objects
  private chunkTextures: Map<string, IChunkTexture> = new Map();
  private chunkSize: number = 0;

  private readonly TILE_SIZE = 32;
  private readonly MAX_WIDTH = 1920;
  private readonly MAX_HEIGHT = 896;

  public get width(): number {
    return this.canvas ? this.canvas.width : 0;
  }
  public get height(): number {
    return this.canvas ? this.canvas.height : 0;
  }

  public bind(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    const browserWidth = window.innerWidth;
    const browserHeight = window.innerHeight;

    const clampedWidth = Math.min(browserWidth, this.MAX_WIDTH);
    const clampedHeight = Math.min(browserHeight, this.MAX_HEIGHT);

    const snappedWidth =
      Math.floor(clampedWidth / this.TILE_SIZE) * this.TILE_SIZE;
    const snappedHeight =
      Math.floor(clampedHeight / this.TILE_SIZE) * this.TILE_SIZE;

    this.canvas.width = snappedWidth;
    this.canvas.height = snappedHeight;

    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  public loadMap(chunk: IMapChunk) {
    const chunkKey = `${chunk.x}_${chunk.y}`;
    if (this.chunkTextures.has(chunkKey)) return;

    const blob = new Blob([chunk.imageBytes], { type: "image/webp" });
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.src = objectUrl;

    img.onload = () => {
      if (this.chunkSize === 0 && img.width > 0) this.chunkSize = img.width;

      // 🟢 Cache the parsed coordinates here, not in the render loop
      this.chunkTextures.set(chunkKey, {
        x: chunk.x,
        y: chunk.y,
        img: img,
      });
      URL.revokeObjectURL(objectUrl);
    };
  }

  public render(camera: ICamera): void {
    if (!this.canvas || !this.ctx) return;

    this.ctx.fillStyle = "#11111b";
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.chunkSize === 0) return;

    // 🟢 Snap camera to integers to prevent sub-pixel shimmering
    const camX = Math.round(camera.x);
    const camY = Math.round(camera.y);

    // 🟢 Loop through pre-parsed chunk objects (Zero allocation, Zero parsing)
    for (const chunk of this.chunkTextures.values()) {
      const drawX = chunk.x * this.chunkSize - camX;
      const drawY = chunk.y * this.chunkSize - camY;

      if (
        drawX + chunk.img.width < 0 ||
        drawY + chunk.img.height < 0 ||
        drawX > this.width ||
        drawY > this.height
      ) {
        continue;
      }

      this.ctx.drawImage(chunk.img, drawX, drawY);
    }
  }

  public renderCharacter(character: Character, camera: ICamera): void {
    if (!this.canvas || !this.ctx) return;

    const worldX = character.renderPosition.x * this.TILE_SIZE;
    const worldY = character.renderPosition.y * this.TILE_SIZE;

    const drawX = Math.round(worldX - camera.x);
    const drawY = Math.round(worldY - camera.y);

    const radius = this.TILE_SIZE / 2;
    this.ctx.beginPath();
    this.ctx.arc(drawX + radius, drawY + radius, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#1b4d3e"; // Background filler
    this.ctx.fill();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.stroke();
  }
}
