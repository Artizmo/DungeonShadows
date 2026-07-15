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

interface IChunkTexture {
  x: number;
  y: number;
  img: HTMLImageElement;
  loaded: boolean;
}

export default class Renderer {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  private readonly CHUNK_SIZE = 256;
  private chunkTextures: Map<string, IChunkTexture> = new Map();

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

    this.canvas.width = clampedWidth;
    this.canvas.height = clampedHeight;

    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  public loadMap(chunks: IMapChunk[]): void {
    if (!chunks || !Array.isArray(chunks)) return;

    for (const chunk of chunks) {
      const chunkKey = `${chunk.x}_${chunk.y}`;
      if (this.chunkTextures.has(chunkKey)) continue;

      const img = new Image();
      const textureEntry: IChunkTexture = {
        x: chunk.x,
        y: chunk.y,
        img: img,
        loaded: false,
      };

      this.chunkTextures.set(chunkKey, textureEntry);

      const blob = new Blob([chunk.textureBytes], { type: "image/webp" });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        textureEntry.loaded = true;
        URL.revokeObjectURL(url);
      };

      img.onerror = (err) => {
        console.error(`❌ Failed to decode map chunk [${chunkKey}]:`, err);
        this.chunkTextures.delete(chunkKey);
      };

      img.src = url;
    }
  }

  public render(character: Character, camera: ICamera): void {
    if (!this.canvas || !this.ctx) return;

    this.ctx.fillStyle = "#11111b";
    this.ctx.fillRect(0, 0, this.width, this.height);

    const camX = Math.round(camera.x);
    const camY = Math.round(camera.y);

    for (const chunk of this.chunkTextures.values()) {
      if (!chunk.loaded) continue;

      const drawX = chunk.x * this.CHUNK_SIZE - camX;
      const drawY = chunk.y * this.CHUNK_SIZE - camY;

      if (
        drawX + this.CHUNK_SIZE < 0 ||
        drawY + this.CHUNK_SIZE < 0 ||
        drawX > this.width ||
        drawY > this.height
      ) {
        continue;
      }

      this.ctx.drawImage(chunk.img, drawX, drawY);
    }

    if (character) {
      this.renderCharacter(character, camera);
    }
  }

  public renderCharacter(character: Character, camera: ICamera): void {
    if (!this.canvas || !this.ctx) return;

    // 🟢 NO CHARACTER_WIDTH MULTIPLIERS: Positions are treated as raw world pixels
    const worldX = character.renderPosition.x;
    const worldY = character.renderPosition.y;

    const relativeX = worldX - camera.x;
    const relativeY = worldY - camera.y;

    const drawX = Math.round(relativeX);
    const drawY = Math.round(relativeY);

    // Hardcode a clean visual radius for the character sprite circle (e.g., 16px radius)
    const radius = 16;

    this.ctx.beginPath();
    // 🟢 Center the arc directly on drawX/drawY instead of throwing in visual cell padding
    this.ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#1b4d3e";
    this.ctx.fill();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.stroke();
  }
}
