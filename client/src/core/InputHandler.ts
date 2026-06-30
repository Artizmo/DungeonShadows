export default class InputHandler {
  public keys: Record<string, boolean> = {
    w: false,
    s: false,
    a: false,
    d: false,
  };

  constructor() {
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) this.keys[key] = true;
    });

    window.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) this.keys[key] = false;
    });
  }
}
