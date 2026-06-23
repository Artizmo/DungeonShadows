export interface BaseEntity {
  id: NetworkId;
  type: EntityType;
  areaId: NetworkId;
  zoneId: NetworkId;
  x: number;
  y: number;
  pendingEvents: Array<{ type: string; payload: any }>;
  activeEffects: Map<string, any>;
  isPlayerControlled?: boolean;
}

type NetworkId = string | number;

enum EntityType {
  CHARACTER = "CHARACTER",
  NPC = "NPC",
  ITEM = "ITEM"
}