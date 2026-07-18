export interface WorldState {
  character: {
    stats: {
      hp: number;
      maxHp: number;
      mana: number;
      maxMana: number;
    };
    position: {
      x: number;
      y: number;
    };
  };
}
