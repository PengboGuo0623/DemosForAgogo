import Phaser from "phaser";
import { COLORS } from "../data/gameConfig";

export class ProgressBar extends Phaser.GameObjects.Container {
  private readonly track: Phaser.GameObjects.Graphics;
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly barWidth = 284;
  private readonly barHeight = 22;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.track = scene.add.graphics();
    this.fill = scene.add.graphics();
    this.add([this.track, this.fill]);
    this.drawTrack();
    this.setProgress(0);
    scene.add.existing(this);
  }

  setProgress(progress: number): void {
    const clamped = Phaser.Math.Clamp(progress, 0, 1);
    this.fill.clear();
    this.fill.fillStyle(COLORS.green, 1);
    this.fill.fillRoundedRect(-this.barWidth / 2, -this.barHeight / 2, this.barWidth * clamped, this.barHeight, 12);
  }

  private drawTrack(): void {
    this.track.clear();
    this.track.fillStyle(COLORS.white, 1);
    this.track.lineStyle(4, COLORS.blue, 1);
    this.track.fillRoundedRect(-this.barWidth / 2, -this.barHeight / 2, this.barWidth, this.barHeight, 12);
    this.track.strokeRoundedRect(-this.barWidth / 2, -this.barHeight / 2, this.barWidth, this.barHeight, 12);
  }
}
