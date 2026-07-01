export default class InputHandler {
  public keys: Record<string, boolean> = {
    w: false,
    s: false,
    a: false,
    d: false,
  };

  // 🎯 Add a deadzone to prevent "ghost movement" from stick drift
  private readonly DEADZONE = 0.3;

  // 🎮 Tracks the index of the actively used gamepad
  private activeGamepadIndex: number | null = null;

  constructor() {
    // ⌨️ Keyboard Event Listeners
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) this.keys[key] = true;
    });

    window.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) this.keys[key] = false;
    });

    // 🎮 Gamepad Lifecycle Listeners
    this.initGamepadListeners();
  }

  private initGamepadListeners(): void {
    window.addEventListener("gamepadconnected", (event: GamepadEvent) => {
      console.log(
        `🎮 Gamepad connected at index ${event.gamepad.index}: ${event.gamepad.id}`,
      );

      // Auto-assign the first controller that connects if we don't have one
      if (this.activeGamepadIndex === null) {
        this.activeGamepadIndex = event.gamepad.index;
      }
    });

    window.addEventListener("gamepaddisconnected", (event: GamepadEvent) => {
      console.log(`❌ Gamepad disconnected from index ${event.gamepad.index}`);

      // If our active controller gets unplugged, hunt for a backup
      if (this.activeGamepadIndex === event.gamepad.index) {
        const remainingGamepads = navigator.getGamepads();
        const fallbackPad = remainingGamepads.find((pad) => pad !== null);

        this.activeGamepadIndex = fallbackPad ? fallbackPad.index : null;
      }
    });
  }

  // 🟢 CALL THIS IN YOUR GAME LOOP
  public updateGamepadState(): void {
    if (this.activeGamepadIndex === null) return;

    // Grab a fresh snapshot of the hardware state
    const gamepads = navigator.getGamepads();
    const pad = gamepads[this.activeGamepadIndex];

    // Guard against edge cases where the controller state turns null mid-frame
    if (!pad) return;

    const axes = pad.axes; // [x, y, ...otherAxes]

    // Map X-axis to A/D
    this.keys.a = axes[0] < -this.DEADZONE;
    this.keys.d = axes[0] > this.DEADZONE;

    // Map Y-axis to W/S
    this.keys.w = axes[1] < -this.DEADZONE;
    this.keys.s = axes[1] > this.DEADZONE;
  }
}
