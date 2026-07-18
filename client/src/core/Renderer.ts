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
  objectUrl?: string; // 🟢 Track URL for safe middle-of-load evictions
}

export default class Renderer {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  private readonly CHUNK_SIZE = 256;
  private chunkTextures: Map<string, IChunkTexture> = new Map();

  // private readonly MAX_WIDTH = 1920;
  // private readonly MAX_HEIGHT = 896;

  public get width(): number {
    return this.canvas ? this.canvas.width : 0;
  }
  public get height(): number {
    return this.canvas ? this.canvas.height : 0;
  }

  public bind(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  public loadMap(chunks: IMapChunk[], unchunks: string[]): void {
    if (!chunks || !Array.isArray(chunks)) return;

    // 🟢 Deletes zone bucket image chunks safely
    if (unchunks) {
      for (const key of unchunks) {
        const entry = this.chunkTextures.get(key);
        if (entry) {
          // 1. Strip callbacks so we don't trigger updates on dead elements
          entry.img.onload = null;
          entry.img.onerror = null;

          // 2. Clear src to prompt immediate GPU/browser texture release
          entry.img.src = "";

          // 3. Revoke Object URL if it hasn't loaded or been cleaned up yet
          if (entry.objectUrl) {
            URL.revokeObjectURL(entry.objectUrl);
          }

          this.chunkTextures.delete(key);
        }
      }
    }

    for (const chunk of chunks) {
      const chunkKey = `${chunk.x}_${chunk.y}`;
      if (this.chunkTextures.has(chunkKey)) continue;

      const img = new Image();
      const blob = new Blob([chunk.textureBytes], { type: "image/webp" });
      const url = URL.createObjectURL(blob);

      const textureEntry: IChunkTexture = {
        x: chunk.x,
        y: chunk.y,
        img: img,
        loaded: false,
        objectUrl: url, // Store the reference immediately
      };

      this.chunkTextures.set(chunkKey, textureEntry);

      img.onload = () => {
        textureEntry.loaded = true;
        if (textureEntry.objectUrl) {
          URL.revokeObjectURL(textureEntry.objectUrl);
          delete textureEntry.objectUrl; // Dereference once revoked
        }
      };

      img.onerror = (err) => {
        console.error(`❌ Failed to decode map chunk [${chunkKey}]:`, err);
        if (textureEntry.objectUrl) {
          URL.revokeObjectURL(textureEntry.objectUrl);
        }
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

      // 🔴 DEBUG OVERLAY: Draw Red Chunk Border
      this.ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(drawX, drawY, this.CHUNK_SIZE, this.CHUNK_SIZE);

      // Set up text styling first so measurements are accurate
      this.ctx.font = "bold 12px monospace";
      const labelText = `[${chunk.x}, ${chunk.y}]`;

      // Calculate background badge sizing dynamically
      const textMetrics = this.ctx.measureText(labelText);
      const paddingX = 6;
      const paddingY = 4;

      const badgeW = textMetrics.width + paddingX * 2;
      const badgeH = 12 + paddingY * 2; // 12px matches font size
      const badgeX = drawX + 4;
      const badgeY = drawY + 4;

      // 1. Draw solid dark background box
      this.ctx.fillStyle = "rgba(17, 17, 27, 0.85)"; // Matches your canvas clear color
      this.ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

      // 2. Draw a subtle border around the text box
      this.ctx.strokeStyle = "#00ffff";
      this.ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      // 3. Draw the bold red text on top
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillText(labelText, badgeX + paddingX, badgeY + paddingY + 10); // +10 aligns text baseline
    }

    if (character) {
      this.renderCharacter(character, camera);
    }
  }

  public renderCharacter(character: Character, camera: ICamera): void {
    if (!this.canvas || !this.ctx) return;

    const worldX = character.renderPosition.x;
    const worldY = character.renderPosition.y;

    const relativeX = worldX - camera.x;
    const relativeY = worldY - camera.y;

    const drawX = Math.round(relativeX);
    const drawY = Math.round(relativeY);

    const radius = 16;

    this.ctx.beginPath();
    this.ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#1b4d3e";
    this.ctx.fill();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.stroke();
  }
}
