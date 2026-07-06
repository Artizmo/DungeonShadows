export default class GamepadController {
  public activeKeys = new Set<string>();
  public justPressedKeys = new Set<string>();
  private lastState = new Set<string>();

  update(): void {
    this.justPressedKeys.clear();
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) {
      this.activeKeys.clear();
      this.lastState.clear();
      return;
    }

    const currentState = new Set<string>();
    const deadzone = 0.3;

    gp.buttons.forEach((b, index) => {
      if (b.pressed) currentState.add(`b${index}`);
    });
    gp.axes.forEach((val, index) => {
      if (val < -deadzone) currentState.add(`a${index}_neg`);
      else if (val > deadzone) currentState.add(`a${index}_pos`);
    });

    currentState.forEach((key) => {
      if (!this.lastState.has(key)) this.justPressedKeys.add(key);
    });
    this.lastState = currentState;
    this.activeKeys = currentState;
  }
}
