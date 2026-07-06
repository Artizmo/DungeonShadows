export default class MenuManager {
  public currentMenu: string | null = null;
  toggleMenu(): void {
    if (this.currentMenu === "PAUSE_MENU") {
      this.currentMenu = null;
    } else {
      this.currentMenu = "PAUSE_MENU";
    }
  }
}
