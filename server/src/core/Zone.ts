export default class Zone {
  id: string;
  areaId: string;
  mapName: string;
  characterIds: Set<string>;

  constructor({ id, areaId, mapName }) {
    this.id = id;
    this.areaId = areaId;
    this.mapName = mapName;
    this.characterIds = new Set();
  }
  addCharacter(charId: string): void {
    this.characterIds.add(charId);
  }
  removeCharacter(charId: string): void {
    this.characterIds.delete(charId);
  }
  get characterCount(): number {
    return this.characterIds.size;
  }
}
