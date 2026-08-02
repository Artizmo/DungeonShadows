import { Entity, Vector2D } from "~/shared/core/types";

export default class Npc implements Entity {
  id: number;
  name: string;
  level: number;
  transform: {
    position: Vector2D;
  };
  speed: number = 100;
  areaId: string;
  zoneId: string;
  width: 32;
  height: 32;
  acts: string[];
  currentBucketIndex: number;

  constructor(npc: Npc) {
    this.id = npc.id;
    this.name = npc.name;
    this.level = npc.level;
    this.transform = {
      ...npc.transform,
    };
    this.width = npc.width;
    this.height = npc.height;
    this.areaId = npc.areaId;
    this.zoneId = npc.zoneId;
    this.acts = npc.acts;
  }

  move(velocity: { x: number; y: number }): void {
    this.transform.position.x += velocity.x;
    this.transform.position.y += velocity.y;
  }
}
