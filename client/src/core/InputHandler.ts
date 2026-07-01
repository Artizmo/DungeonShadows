export default class InputHandler {
  public keys: Record<string, boolean> = {
    w: false,
    s: false,
    a: false,
    d: false,
  };

  // 🎯 Add a deadzone to prevent "ghost movement" from stick drift
  private readonly DEADZONE = 0.3;

  constructor() {
    // Keep your existing Keyboard event listeners here...
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) this.keys[key] = true;
    });
    window.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) this.keys[key] = false;
    });
  }

  // 🟢 CALL THIS IN YOUR GAME LOOP
  public updateGamepadState(): void {
    const gamepads = navigator.getGamepads();
    const pad = gamepads[1];
    if (!pad) return;
    // Reset current gamepad-driven keys before recalculating
    // (This allows you to override the stick position with keyboard if needed)
    const axes = pad.axes; // [x, y, ...otherAxes]

    // Map X-axis to A/D
    this.keys.a = axes[0] < -this.DEADZONE;
    this.keys.d = axes[0] > this.DEADZONE;

    // Map Y-axis to W/S
    this.keys.w = axes[1] < -this.DEADZONE;
    this.keys.s = axes[1] > this.DEADZONE;
  }
}
