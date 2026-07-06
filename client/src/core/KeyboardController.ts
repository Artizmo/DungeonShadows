export default class KeyboardController {
  public activeKeys = new Set<string>();
  public justPressedKeys = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (!this.activeKeys.has(key)) {
        this.activeKeys.add(key);
        this.justPressedKeys.add(key);
      }
    });
    window.addEventListener("keyup", (e) =>
      this.activeKeys.delete(e.key.toLowerCase()),
    );
  }
  clearJustPressed(): void {
    this.justPressedKeys.clear();
  }
}
