import Phaser from "phaser";
import { ART_KEYS, ART_PATHS, COLORS } from "../data/gameConfig";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.load.image(ART_KEYS.backgroundStage, ART_PATHS.backgroundStage);
    this.load.image(ART_KEYS.backgroundBridgeStage, ART_PATHS.backgroundBridgeStage);
    this.load.image(ART_KEYS.bridgeCompletionPatch, ART_PATHS.bridgeCompletionPatch);
    this.load.image(ART_KEYS.starFriendBody, ART_PATHS.starFriendBody);
    this.load.image(ART_KEYS.bridgePlankEmpty, ART_PATHS.bridgePlankEmpty);
    this.load.image(ART_KEYS.bridgePlankFilled, ART_PATHS.bridgePlankFilled);
    this.load.image(ART_KEYS.numberPlank, ART_PATHS.numberPlank);
    this.load.image(ART_KEYS.speechCloud, ART_PATHS.speechCloud);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.scene.start("MenuScene");
  }
}
