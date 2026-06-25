interface Position {
  x: number;
  y: number;
}

interface Stats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  speed: number;
}

interface Effect {
  name: string;
  type: string;
  duration: number;
  density: number;
  interval?: number;
}

export default class Character {
  public id: number;
  public playerId: number;
  public name: string;
  public level: number;
  public zoneMap: Buffer;
  public position: Position;
  public displayX: number = 0;
  public displayY: number = 0;
  public stats: Stats;
  public inventory: string[] = [];
  public effects: Map<string, Effect> = new Map();
  public lastProcessedInput: number = 0;
  public onPendingEvent?: (charId: number) => void;
  constructor(character: Character) {
    this.id = character.id;
    this.playerId = character.playerId;
    this.name = character.name;
    this.level = character.level;
    this.stats = character.stats;

    // 🎯 Safety Fallback: Ensure position object exists immediately
    // to prevent LERP math from throwing errors on frame 1
    this.position = character.position || { x: 0, y: 0 };
    this.displayX = this.position.x;
    this.displayY = this.position.y;

    this.effects = character.effects;
    this.zoneMap = character.zoneMap;
  }

  public init(x: number, y: number) {
    this.position = { x, y };
    this.displayX = x;
    this.displayY = y;
  }

  public tick() {}
}
