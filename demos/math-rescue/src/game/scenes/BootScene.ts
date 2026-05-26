import Phaser from "phaser";
import { ART_KEYS, ART_PATHS, COLORS } from "../data/gameConfig";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.bindLoadingProgress();
    this.loadImage(ART_KEYS.backgroundStage, ART_PATHS.backgroundStage);
    this.loadImage(ART_KEYS.bridgeCompletionPatch, ART_PATHS.bridgeCompletionPatch);
    this.loadImage(ART_KEYS.rescueBuddy, ART_PATHS.rescueBuddy);
    this.loadImage(ART_KEYS.questionNumberBoard, ART_PATHS.questionNumberBoard);
    this.loadImage(ART_KEYS.numberPlank, ART_PATHS.numberPlank);
    this.loadImage(ART_KEYS.speechCloud, ART_PATHS.speechCloud);
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

  private bindLoadingProgress(): void {
    const shell = document.getElementById("loading-shell");

    if (!shell) {
      return;
    }

    const setProgress = (value: number): void => {
      const percent = Phaser.Math.Clamp(value, 0.16, 1) * 100;
      shell.style.setProperty("--load-progress", `${percent.toFixed(0)}%`);
    };

    setProgress(0.16);
    this.load.on(Phaser.Loader.Events.PROGRESS, setProgress);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      setProgress(1);
      this.load.off(Phaser.Loader.Events.PROGRESS, setProgress);
    });
  }
}
