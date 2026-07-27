import type Zone from "~/core/Zone";
import { FLAG_NONE } from "~/shared/core/constants";
import type { ICoords } from "~/shared/core/types";

export default class Npc {
  id: number;
  name: string;
  level: number;
  position: ICoords;
  areaId: string;
  zoneId: string;
  width: 32;
  height: 32;
  acts: string[];
  currentBucketId: string | null = null;
  dirtyFlags: number = 0;

  constructor(npc: Npc) {
    this.id = npc.id;
    this.name = npc.name;
    this.level = npc.level;
    this.position = { ...npc.position };
    // this.width = npc.width;
    // this.height = npc.height;
    this.areaId = npc.areaId;
    this.zoneId = npc.zoneId;
    this.acts = npc.acts;
  }
}
