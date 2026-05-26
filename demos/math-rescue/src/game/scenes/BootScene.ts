import Phaser from "phaser";
import { ART_KEYS, ART_PATHS, COLORS } from "../data/gameConfig";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.loadImage(ART_KEYS.backgroundStage, ART_PATHS.backgroundStage);
    this.loadImage(ART_KEYS.rescueBuddy, ART_PATHS.rescueBuddy);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    document.getElementById("loading-shell")?.remove();
    this.scene.start("MenuScene");
  }

  private loadImage(key: string, path: string): void {
    if (!this.textures.exists(key)) {
      this.load.image(key, path);
    }
  }
}
