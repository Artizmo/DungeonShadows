import type Character from "./Character";

export interface IMapChunk {
  x: number;
  y: number;
  textureBytes: Uint8Array;
}

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
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  readonly TILE_SIZE = 32;
  private chunkTextures: Map<string, IChunkTexture> = new Map();
  private chunkSize: number = 0;

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

    // Convert Uint8Array to binary string
    let binary = "";
    const len = chunk.textureBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(chunk.textureBytes[i]);
    }
    const base64 = btoa(binary);

    const img = new Image();
    img.src = `data:image/webp;base64,${base64}`;

    img.onload = () => {
      if (this.chunkSize === 0 && img.width > 0) this.chunkSize = img.width;

      this.chunkTextures.set(chunkKey, {
        x: chunk.x,
        y: chunk.y,
        img: img,
      });
    };
  }

  public render(character: Character, camera: ICamera): void {
    if (!this.canvas || !this.ctx) return;

    // 1. Clear the screen with the background color
    this.ctx.fillStyle = "#11111b";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Snap camera to integers to prevent sub-pixel shimmering
    const camX = Math.round(camera.x);
    const camY = Math.round(camera.y);

    // 3. Render map chunks (Only if they are ready)
    if (this.chunkSize > 0) {
      // Un-commented chunk loop so the background actually draws
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

    // 4. Render the character LAST so they appear on top of the world map
    if (character) {
      this.renderCharacter(character, camera);
    }
  }

  public renderCharacter(character: Character, camera: ICamera): void {
    if (!this.canvas || !this.ctx) return;

    // 1. Get the raw world coordinates
    const worldX = character.renderPosition.x * this.TILE_SIZE;
    const worldY = character.renderPosition.y * this.TILE_SIZE;

    // 2. Calculate the relative position to camera
    const relativeX = worldX - camera.x;
    const relativeY = worldY - camera.y;

    // 3. Round only at the very end for the draw call
    const drawX = Math.round(relativeX);
    const drawY = Math.round(relativeY);

    const radius = this.TILE_SIZE / 2;

    this.ctx.beginPath();
    this.ctx.arc(drawX + radius, drawY + radius, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#1b4d3e"; // Background filler
    this.ctx.fill();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.stroke();
  }
}
