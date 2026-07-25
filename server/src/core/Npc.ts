import type Zone from "~/core/Zone";
import { FLAG_NONE } from "~/shared/core/constants";
import type { ICoords } from "~/shared/core/types";

export default class Npc {
  id: number;
  name: string;
  level: number;
  position: ICoords;
  renderPosition: ICoords;
  zone: Zone;
  width: 32;
  height: 32;
  acts: string[];
  currentBucketKey: string | null = null;
  dirtyFlags: number = 0;

  constructor(npc: Npc) {
    this.id = npc.id;
    this.name = npc.name;
    this.level = npc.level;
    this.position = {
      x: npc.position.x,
      y: npc.position.y,
    };
    this.renderPosition = {
      x: npc.renderPosition.x,
      y: npc.renderPosition.y,
    };
    this.width = npc.width;
    this.height = npc.height;
    this.zone = npc.zone;
    this.acts = npc.acts;
  }
}
