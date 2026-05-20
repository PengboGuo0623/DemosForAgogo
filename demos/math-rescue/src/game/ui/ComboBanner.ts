import Phaser from "phaser";
import { COLORS } from "../data/gameConfig";

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
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "30px",
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
    this.panel.fillStyle(tint, 1);
    this.panel.lineStyle(4, COLORS.white, 1);
    this.panel.fillRoundedRect(-140, -38, 280, 76, 32);
    this.panel.strokeRoundedRect(-140, -38, 280, 76, 32);
    this.panel.fillStyle(COLORS.white, 0.22);
    this.panel.fillRoundedRect(-118, -26, 236, 20, 14);
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
      duration: isCombo ? 250 : 180,
      ease: "Back.easeOut",
    });

    if (isCombo) {
      this.scene.tweens.add({
        targets: this.sparkles,
        angle: 180,
        scale: 1.35,
        duration: 420,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }
  }

  hideSoon(delay = 760): void {
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
