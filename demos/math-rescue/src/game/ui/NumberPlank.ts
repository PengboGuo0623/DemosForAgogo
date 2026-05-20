import Phaser from "phaser";
import { ART_KEYS, COLORS, UI_FONT } from "../data/gameConfig";

export class NumberPlank extends Phaser.GameObjects.Container {
  private readonly plank: Phaser.GameObjects.Graphics;
  private readonly plankTexture: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private readonly hitZone: Phaser.GameObjects.Zone;
  private readonly plankWidth = 96;
  private readonly plankHeight = 42;
  private readonly hitZoneWidth = 144;
  private readonly hitZoneHeight = 98;
  private readonly restScale = 0.92;
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
        fontFamily: UI_FONT,
        fontSize: "22px",
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
    this.hitZone.on("pointerover", () => this.setScale(this.restScale * 1.045));
    this.hitZone.on("pointerout", () => this.setScale(this.restScale));
    this.hitZone.on("pointerdown", () => {
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({
        targets: this,
        scale: this.restScale * 0.96,
        duration: 86,
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
    this.setAlpha(0.96);
    this.setScale(this.restScale);
    this.hitZone.setPosition(this.homeX, this.homeY);
    this.hitZone.setInteractive({ useHandCursor: true });
  }

  flyToBridge(targetX: number, targetY: number, targetAngle: number, onComplete: () => void): void {
    this.disableChoice(false);
    this.setDepth(19);
    this.plank.clear();
    this.scene.tweens.killTweensOf(this);
    const startX = this.x;
    const startY = this.y;
    const startAngle = this.angle;
    const startScale = this.scale;
    const flight = { t: 0 };
    const controlX = (startX + targetX) / 2;
    const controlY = Math.min(startY, targetY) - 98;

    this.scene.tweens.add({
      targets: this.label,
      alpha: 0,
      y: -12,
      duration: 260,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: this.plankTexture,
      alpha: 0.2,
      duration: 760,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: flight,
      t: 1,
      duration: 1280,
      ease: "Cubic.easeInOut",
      onUpdate: () => {
        const t = flight.t;
        const inv = 1 - t;
        this.x = inv * inv * startX + 2 * inv * t * controlX + t * t * targetX;
        this.y = inv * inv * startY + 2 * inv * t * controlY + t * t * targetY;
        this.scale = Phaser.Math.Linear(startScale, 0.14, t);
        this.angle = Phaser.Math.Linear(startAngle, targetAngle, t);
        this.alpha = Phaser.Math.Linear(1, 0.48, t);
      },
      onComplete: () => {
        this.setPosition(targetX, targetY);
        this.setScale(0.14);
        this.angle = targetAngle;
        onComplete();
      },
    });
  }

  driftInFrom(startX: number, startY: number, delay: number, onComplete?: () => void): void {
    this.disableChoice(false);
    this.scene.tweens.killTweensOf(this);
    this.setPosition(startX, startY);
    this.setAlpha(0);
    this.setScale(0.58);
    this.angle = this.homeAngle + Phaser.Math.Between(-10, 10);
    const drift = { t: 0 };
    const startAngle = this.angle;
    const waveDirection = this.homeX < startX ? -1 : 1;

    this.scene.tweens.add({
      targets: drift,
      t: 1,
      delay,
      duration: 1160,
      ease: "Cubic.easeOut",
      onUpdate: () => {
        const t = drift.t;
        this.x = Phaser.Math.Linear(startX, this.homeX, t) + Math.sin(t * Math.PI) * 18 * waveDirection;
        this.y = Phaser.Math.Linear(startY, this.homeY, t) - Math.sin(t * Math.PI) * 18;
        this.alpha = Phaser.Math.Clamp(t * 1.4, 0, 0.96);
        this.scale = Phaser.Math.Linear(0.58, this.restScale, t);
        this.angle = Phaser.Math.Linear(startAngle, this.homeAngle, t);
      },
      onComplete: () => {
        this.setPosition(this.homeX, this.homeY);
        this.setScale(this.restScale);
        this.angle = this.homeAngle;
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
        this.scale = this.restScale;
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
      angle: this.homeAngle + 1.6,
      duration: 1120 + Phaser.Math.Between(0, 260),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private draw(fillColor: number, strokeColor: number): void {
    this.plank.clear();
    const glowColor = strokeColor === COLORS.coral ? COLORS.coral : strokeColor === COLORS.greenDark ? COLORS.green : COLORS.white;
    const glowAlpha = strokeColor === COLORS.coral ? 0.18 : strokeColor === COLORS.greenDark ? 0.16 : 0.045;
    this.plank.fillStyle(glowColor, glowAlpha);
    this.plank.fillEllipse(0, 3, this.plankWidth + 30, this.plankHeight + 16);
    this.plankTexture.clearTint();
  }
}
