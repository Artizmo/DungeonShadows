import type Character from "~/core/Character";

// Index mapping for the flat buffer array (No Velocity)
const enum StateIndex {
  X = 0,
  Y = 1,
  HP = 2,
  MAX_HP = 3,
  MANA = 4,
  MAX_MANA = 5,
  BUFFER_SIZE = 6,
}

export class StateManager {
  // Pre-allocated typed arrays (Zero Heap GC)
  private readonly predictedBuffer = new Float64Array(StateIndex.BUFFER_SIZE);
  private readonly replayedBuffer = new Float64Array(StateIndex.BUFFER_SIZE);
  private hasActivePrediction = false;

  setState(character: Character, serverData: any): void {
    const serverCharState = serverData.state.character;

    // 1. Cache local prediction into typed array
    this.serializeTo(character, this.predictedBuffer);
    this.hasActivePrediction = true;

    // 2. Apply server baseline directly
    if (serverCharState.position) {
      if (serverCharState.position.x !== undefined)
        character.position.x = serverCharState.position.x;
      if (serverCharState.position.y !== undefined)
        character.position.y = serverCharState.position.y;
    }

    if (serverCharState.stats && character.stats) {
      if (serverCharState.stats.hp !== undefined)
        character.stats.hp = serverCharState.stats.hp;
      if (serverCharState.stats.maxHp !== undefined)
        character.stats.maxHp = serverCharState.stats.maxHp;
      if (serverCharState.stats.mana !== undefined)
        character.stats.mana = serverCharState.stats.mana;
      if (serverCharState.stats.maxMana !== undefined)
        character.stats.maxMana = serverCharState.stats.maxMana;
    }
  }

  reconcile(character: Character, tolerance = 0.05): boolean {
    if (!this.hasActivePrediction) return false;

    // 1. Serialize replayed state into secondary pre-allocated buffer
    this.serializeTo(character, this.replayedBuffer);

    // 2. Direct O(1) array index math calculation
    const posError = Math.hypot(
      this.replayedBuffer[StateIndex.X] - this.predictedBuffer[StateIndex.X],
      this.replayedBuffer[StateIndex.Y] - this.predictedBuffer[StateIndex.Y],
    );
    const hpError = Math.abs(
      this.replayedBuffer[StateIndex.HP] - this.predictedBuffer[StateIndex.HP],
    );
    const manaError = Math.abs(
      this.replayedBuffer[StateIndex.MANA] -
        this.predictedBuffer[StateIndex.MANA],
    );

    const errorDistance = posError + hpError + manaError;

    let corrected = false;
    const dx =
      this.replayedBuffer[StateIndex.X] - this.predictedBuffer[StateIndex.X];
    const dy =
      this.replayedBuffer[StateIndex.Y] - this.predictedBuffer[StateIndex.Y];

    if (errorDistance > tolerance) {
      console.log(`[MISMATCH] dx: ${dx}, dy: ${dy}, posError: ${posError}`);
      console.log("Legitimate server correction triggered:", errorDistance);
      corrected = true;
    } else {
      // Restore cached local prediction from buffer
      this.deserializeFrom(character, this.predictedBuffer);
    }

    this.hasActivePrediction = false;
    return corrected;
  }

  /**
   * Serializes character state directly into pre-allocated flat memory buffer.
   */
  private serializeTo(character: Character, buffer: Float64Array): void {
    buffer[StateIndex.X] = character.position.x;
    buffer[StateIndex.Y] = character.position.y;
    buffer[StateIndex.HP] = character.stats?.hp ?? 0;
    buffer[StateIndex.MAX_HP] = character.stats?.maxHp ?? 0;
    buffer[StateIndex.MANA] = character.stats?.mana ?? 0;
    buffer[StateIndex.MAX_MANA] = character.stats?.maxMana ?? 0;
  }

  /**
   * Applies buffer values back to character properties.
   */
  private deserializeFrom(character: Character, buffer: Float64Array): void {
    character.position.x = buffer[StateIndex.X];
    character.position.y = buffer[StateIndex.Y];
    if (character.stats) {
      character.stats.hp = buffer[StateIndex.HP];
      character.stats.maxHp = buffer[StateIndex.MAX_HP];
      character.stats.mana = buffer[StateIndex.MANA];
      character.stats.maxMana = buffer[StateIndex.MAX_MANA];
    }
  }
}
