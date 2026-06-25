export interface Position {
  x: number;
  y: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  speed: number;
}

export interface Effect {
  name: string;
  type: string;
  duration: number;
  density: number;
  interval?: number;
}
