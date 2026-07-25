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
  objectUrl?: string;
}

export interface IRenderableEntity {
  id: number;
  name: string;
  level: number;
  type: string; // "npc" | "character" | "item"
  position: { x: number; y: number };
  width?: number;
  height?: number;
  isTargeted?: boolean;
}

// Helper type to extend entities with calculated screen coordinates during the render tick
type VisibleEntity = IRenderableEntity & { drawX: number; drawY: number };

export default class Renderer {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  private readonly CHUNK_SIZE = 256;
  private chunkTextures: Map<string, IChunkTexture> = new Map();

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

    // Safely delete zone bucket image chunks out of view
    if (unchunks) {
      for (const key of unchunks) {
        const entry = this.chunkTextures.get(key);
        if (entry) {
          entry.img.onload = null;
          entry.img.onerror = null;
          entry.img.src = "";

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
        objectUrl: url,
      };

      this.chunkTextures.set(chunkKey, textureEntry);

      img.onload = () => {
        textureEntry.loaded = true;
        if (textureEntry.objectUrl) {
          URL.revokeObjectURL(textureEntry.objectUrl);
          delete textureEntry.objectUrl;
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

  // ==========================================
  // MASTER RENDER PIPELINE
  // ==========================================
  public render(
    character: Character,
    camera: ICamera,
    entities: Map<number, IRenderableEntity> | IRenderableEntity[] = []
  ): void {
    if (!this.canvas || !this.ctx) return;

    // 1. CLEAR SCREEN
    this.ctx.fillStyle = "#11111b";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. CULLING PASS: Pre-filter to save CPU
    const visibleEntities = this.getVisibleEntities(entities, camera);

    // 3. BASE WORLD PASS
    this.renderMapChunks(camera);

    // 4. ENTITY BODIES PASS
    this.renderEntityBodies(visibleEntities);
    if (character) this.renderCharacter(character, camera);

    // 5. DYNAMIC LIGHTING PASS (Placeholder for future)
    // this.renderLighting(visibleEntities, character, camera);

    // 6. UI / OVERLAYS PASS (Drawn on top of lighting/shadows)
    // this.renderEntityOverlays(visibleEntities);
  }

  // ==========================================
  // PIPELINE METHODS
  // ==========================================

  private getVisibleEntities(
    entities: Map<number, IRenderableEntity> | IRenderableEntity[],
    camera: ICamera
  ): VisibleEntity[] {
    const visible: VisibleEntity[] = [];
    const entityList = entities instanceof Map ? entities.values() : entities;

    const camX = Math.round(camera.x);
    const camY = Math.round(camera.y);

    // 🟢 Buffer zone: render entities up to 128 pixels off-screen
    // so they can smoothly slide into the viewport without popping.
    const cullBuffer = 64;

    for (const entity of entityList) {
      const width = entity.width || 32;
      const height = entity.height || 32;

      const drawX = Math.round(entity.position.x - camX);
      const drawY = Math.round(entity.position.y - camY);

      // Frustum Culling with buffer
      if (
        drawX + width < -cullBuffer ||
        drawY + height < -cullBuffer ||
        drawX > this.width + cullBuffer ||
        drawY > this.height + cullBuffer
      ) {
        continue;
      }

      visible.push({ ...entity, drawX, drawY });
    }

    return visible;
  }

  private renderMapChunks(camera: ICamera): void {
    if (!this.ctx) return;

    const camX = Math.round(camera.x);
    const camY = Math.round(camera.y);

    for (const chunk of this.chunkTextures.values()) {
      if (!chunk.loaded) continue;

      const drawX = chunk.x * this.CHUNK_SIZE - camX;
      const drawY = chunk.y * this.CHUNK_SIZE - camY;

      // Culling for map chunks
      if (
        drawX + this.CHUNK_SIZE < 0 ||
        drawY + this.CHUNK_SIZE < 0 ||
        drawX > this.width ||
        drawY > this.height
      ) {
        continue;
      }

      this.ctx.drawImage(chunk.img, drawX, drawY);

      // Map Chunk Debug Overlay
      this.ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(drawX, drawY, this.CHUNK_SIZE, this.CHUNK_SIZE);

      this.ctx.font = "bold 12px monospace";
      const labelText = `[${chunk.x}, ${chunk.y}]`;
      const textMetrics = this.ctx.measureText(labelText);

      const paddingX = 6;
      const paddingY = 4;
      const badgeW = textMetrics.width + paddingX * 2;
      const badgeH = 12 + paddingY * 2;
      const badgeX = drawX + 4;
      const badgeY = drawY + 4;

      this.ctx.fillStyle = "rgba(17, 17, 27, 0.85)";
      this.ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

      this.ctx.strokeStyle = "#00ffff";
      this.ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillText(labelText, badgeX + paddingX, badgeY + paddingY + 10);
    }
  }

  renderEntityBodies(entities: VisibleEntity[]): void {
    if (!this.ctx) return;

    for (const entity of entities) {
      this.ctx.save();

      if (entity.type === "npc") {
        this.ctx.fillStyle = "rgba(235, 77, 75, 1.0)";
      } else if (entity.type === "character") {
        this.ctx.fillStyle = "rgba(46, 204, 113, 1.0)";
      } else {
        this.ctx.fillStyle = "rgba(241, 196, 15, 1.0)"; // items/objects
      }

      this.ctx.beginPath();
      this.ctx.arc(entity.drawX, entity.drawY, 16, 0, Math.PI * 2);
      this.ctx.fillStyle = "rgba(235, 77, 75, 1.0)";
      this.ctx.fill();
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.font = "bold 12px courier new";
      const labelText = `(${entity.level}) ${entity.name}`;
      const textMetrics = this.ctx.measureText(labelText);

      const paddingX = 6;
      const paddingY = 4;
      const badgeW = textMetrics.width + paddingX * 2;
      const badgeH = 12 + paddingY * 2;
      const badgeX = entity.drawX - 30;
      const badgeY = entity.drawY - 40;

      this.ctx.fillStyle = "rgba(33, 27, 16, 0.75)";
      this.ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

      this.ctx.strokeStyle = "rgba(17, 17, 27, 1)";
      this.ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      this.ctx.fillStyle = "#ffd83f";
      this.ctx.fillText(labelText, badgeX + paddingX, badgeY + paddingY + 10);

      this.ctx.restore();
    }
  }

  public renderCharacter(character: Character, camera: ICamera): void {
    if (!this.canvas || !this.ctx) return;

    const drawX = Math.round(character.renderPosition.x - camera.x);
    const drawY = Math.round(character.renderPosition.y - camera.y);
    const radius = 16;

    this.ctx.beginPath();
    this.ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#1b4d3e";
    this.ctx.fill();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
}
