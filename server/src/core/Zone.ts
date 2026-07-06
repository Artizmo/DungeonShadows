export default class Zone {
  public id: string;
  public mapName: string;
  public characterIds: Set<string>;

  constructor(id: string, mapName: string) {
    this.id = id;
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
