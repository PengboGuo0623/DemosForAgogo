import Phaser from "phaser";
import { ART_KEYS, COLORS } from "../data/gameConfig";

export class NumberPlank extends Phaser.GameObjects.Container {
  private readonly plank: Phaser.GameObjects.Graphics;
  private readonly plankTexture: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private readonly hitZone: Phaser.GameObjects.Zone;
  private readonly plankWidth = 116;
  private readonly plankHeight = 52;
  private readonly hitZoneWidth = 144;
  private readonly hitZoneHeight = 98;
  private readonly homeX: number;
  private readonly homeY: number;
  private readonly homeAngle: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly value: number,
    onSelect: (value: number, plank: NumberPlank) => void,
    angle = 0,
  ) {
    super(scene, x, y);

    this.homeX = x;
    this.homeY = y;
    this.homeAngle = angle;
    this.angle = angle;
    this.plank = scene.add.graphics();
    this.plankTexture = scene.add.image(0, 0, ART_KEYS.numberPlank).setDisplaySize(this.plankWidth, this.plankHeight);
    this.label = scene.add
      .text(0, -1, String(value), {
        color: "#203147",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "25px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add([this.plank, this.plankTexture, this.label]);
    this.draw(COLORS.cream, COLORS.yellow);
    this.setSize(this.plankWidth, this.plankHeight);
    scene.add.existing(this);

    this.hitZone = scene.add.zone(x, y, this.hitZoneWidth, this.hitZoneHeight);
    this.hitZone.setName("NumberPlankHitZone");
    this.hitZone.setData("value", value);
    this.hitZone.setInteractive({ useHandCursor: true });
    this.hitZone.on("pointerover", () => this.setScale(1.025));
    this.hitZone.on("pointerout", () => this.setScale(1));
    this.hitZone.on("pointerdown", () => {
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({
        targets: this,
        scale: 0.97,
        duration: 70,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
      onSelect(value, this);
    });
  }

  disableChoice(dim = true): void {
    this.hitZone.disableInteractive();
    if (dim) {
      this.setAlpha(0.48);
    }
  }

  enableChoice(): void {
    this.setAlpha(1);
    this.hitZone.setPosition(this.homeX, this.homeY);
    this.hitZone.setInteractive({ useHandCursor: true });
  }

  flyToBridge(targetX: number, targetY: number, targetAngle: number, onComplete: () => void): void {
    this.disableChoice(false);
    this.setDepth(19);
    this.plank.clear();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this.label,
      alpha: 0,
      duration: 220,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: this.plankTexture,
      alpha: 0.32,
      duration: 520,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      scaleX: 0.16,
      scaleY: 0.16,
      angle: targetAngle,
      duration: 820,
      ease: "Sine.easeInOut",
      onComplete,
    });
  }

  driftInFrom(startX: number, startY: number, delay: number, onComplete?: () => void): void {
    this.disableChoice(false);
    this.scene.tweens.killTweensOf(this);
    this.setPosition(startX, startY);
    this.setAlpha(0);
    this.setScale(0.66);
    this.angle = this.homeAngle + Phaser.Math.Between(-10, 10);

    this.scene.tweens.add({
      targets: this,
      x: this.homeX,
      y: this.homeY,
      alpha: 1,
      scale: 1,
      angle: this.homeAngle,
      delay,
      duration: 760,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.enableChoice();
        this.startFloat();
        onComplete?.();
      },
    });
  }

  nudgeBack(): void {
    this.hitZone.disableInteractive();
    this.scene.tweens.killTweensOf(this);
    this.draw(COLORS.cream, COLORS.coral);
    this.scene.tweens.add({
      targets: this,
      x: {
        from: this.homeX - 7,
        to: this.homeX + 7,
      },
      angle: {
        from: -2,
        to: 2,
      },
      duration: 90,
      yoyo: true,
      repeat: 4,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.x = this.homeX;
        this.y = this.homeY;
        this.angle = this.homeAngle;
        this.scale = 1;
        this.draw(COLORS.cream, COLORS.yellow);
        this.hitZone.setPosition(this.homeX, this.homeY);
        this.hitZone.setInteractive({ useHandCursor: true });
        this.startFloat();
      },
    });
  }

  destroy(fromScene?: boolean): void {
    this.hitZone.destroy(fromScene);
    super.destroy(fromScene);
  }

  private startFloat(): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: this.homeY - 4,
      duration: 1120 + Phaser.Math.Between(0, 260),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private draw(fillColor: number, strokeColor: number): void {
    this.plank.clear();
    const glowColor = strokeColor === COLORS.coral ? COLORS.coral : strokeColor === COLORS.greenDark ? COLORS.green : COLORS.white;
    const glowAlpha = strokeColor === COLORS.coral ? 0.2 : strokeColor === COLORS.greenDark ? 0.18 : 0.08;
    this.plank.fillStyle(glowColor, glowAlpha);
    this.plank.fillEllipse(0, 2, this.plankWidth + 22, this.plankHeight + 14);
    this.plankTexture.clearTint();
  }
}
