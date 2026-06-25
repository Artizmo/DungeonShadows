export default class Act {
  type: string;
  enabled: boolean;

  constructor(type: string) {
    this.type = type;
    this.enabled = true;
  }

  update() {
    if (!this.enabled) return;
  }
}
