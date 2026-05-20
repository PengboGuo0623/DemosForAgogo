import Phaser from "phaser";
import { COLORS, UI_FONT } from "../data/gameConfig";

export class ComboBanner extends Phaser.GameObjects.Container {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly sparkles: Phaser.GameObjects.Star[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.panel = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, "", {
        color: "#203147",
        fontFamily: UI_FONT,
        fontSize: "28px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    for (let index = 0; index < 4; index += 1) {
      const sparkle = scene.add.star(index < 2 ? -118 : 118, index % 2 === 0 ? -28 : 28, 5, 5, 11, COLORS.white);
      this.sparkles.push(sparkle);
    }

    this.add([this.panel, ...this.sparkles, this.label]);
    this.setVisible(false);
    scene.add.existing(this);
  }

  show(message: string, tint: number = COLORS.yellow, isCombo = false): void {
    this.panel.clear();
    this.panel.fillStyle(COLORS.shadow, 0.14);
    this.panel.fillRoundedRect(-150, -34, 300, 72, 34);
    this.panel.fillStyle(tint, 0.94);
    this.panel.lineStyle(4, COLORS.white, 0.86);
    this.panel.fillRoundedRect(-142, -42, 284, 74, 34);
    this.panel.strokeRoundedRect(-142, -42, 284, 74, 34);
    this.panel.fillStyle(COLORS.white, 0.22);
    this.panel.fillRoundedRect(-116, -30, 232, 18, 12);
    this.label.setText(message);
    this.label.setFontSize(isCombo ? 31 : 28);
    this.sparkles.forEach((sparkle) => sparkle.setVisible(isCombo));
    this.setVisible(true);
    this.setScale(isCombo ? 0.66 : 0.76);
    this.setAlpha(0);

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: isCombo ? 340 : 220,
      ease: "Back.easeOut",
    });

    if (isCombo) {
      this.scene.tweens.add({
        targets: this.sparkles,
        angle: 180,
        scale: 1.35,
        duration: 620,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }
  }

  hideSoon(delay = 1080): void {
    this.scene.time.delayedCall(delay, () => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 160,
        onComplete: () => this.setVisible(false),
      });
    });
  }
}
