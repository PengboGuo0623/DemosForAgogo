import Phaser from "phaser";
import { ART_KEYS, COLORS, UI_FONT } from "../data/gameConfig";

export class StoryBubble extends Phaser.GameObjects.Container {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly cloudImage: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private bubbleToken = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.panel = scene.add.graphics();
    this.cloudImage = scene.add.image(0, 0, ART_KEYS.speechCloud);
    this.label = scene.add
      .text(0, -6, "", {
        color: "#203147",
        fontFamily: UI_FONT,
        fontSize: "20px",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    this.add([this.panel, this.cloudImage, this.label]);
    this.setVisible(false);
    scene.add.existing(this);
  }

  show(message: string, x: number, y: number, tint: number = COLORS.white): void {
    this.bubbleToken += 1;
    const width = Phaser.Math.Clamp(58 + message.length * 15, 88, 148);

    this.scene.tweens.killTweensOf(this);
    this.panel.clear();
    this.cloudImage.setDisplaySize(width + 72, 84);
    this.cloudImage.clearTint();
    this.panel.fillStyle(tint, tint === COLORS.white ? 0.18 : 0.16);
    this.panel.fillEllipse(0, 14, width + 54, 38);
    this.label.setText(message);
    this.setPosition(x, y);
    this.setVisible(true);
    this.setAlpha(0);
    this.setScale(0.78);

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: "Back.easeOut",
    });
  }

  hide(delay = 0): void {
    const token = this.bubbleToken;
    this.scene.time.delayedCall(delay, () => {
      if (token !== this.bubbleToken) {
        return;
      }

      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scale: 0.86,
        duration: 150,
        ease: "Sine.easeIn",
        onComplete: () => this.setVisible(false),
      });
    });
  }

  hideNow(): void {
    this.bubbleToken += 1;
    this.scene.tweens.killTweensOf(this);
    this.setVisible(false);
    this.setAlpha(0);
  }
}
