import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_RULES } from "../data/gameConfig";

export class RescueFriend extends Phaser.GameObjects.Container {
  private idleTween?: Phaser.Tweens.Tween;
  private readonly starImage: Phaser.GameObjects.Image;
  private readonly friendOriginX: number;
  private readonly friendOriginY: number;
  private readonly startX = -312;
  private readonly endX = 312;
  private readonly baseY = 8;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.friendOriginX = x;
    this.friendOriginY = y;
    const shadow = scene.add.ellipse(0, 38, 50, 11, COLORS.shadow, 0.18);
    this.starImage = scene.add.image(0, -2, ART_KEYS.starFriendBody).setDisplaySize(92, 87);

    this.add([shadow, this.starImage]);
    scene.add.existing(this);
    this.setProgress(0);
  }

  setProgress(completedSteps: number): void {
    this.stopIdle();
    const t = Phaser.Math.Clamp(completedSteps / GAME_RULES.questionsPerRound, 0, 1);
    this.x = this.friendOriginX + Phaser.Math.Linear(this.startX, this.endX, t);
    this.y = this.friendOriginY + this.baseY;
    this.scale = 1;
    this.angle = 0;
    this.startIdle();
  }

  hopTo(completedSteps: number): void {
    this.stopIdle();
    const t = Phaser.Math.Clamp(completedSteps / GAME_RULES.questionsPerRound, 0, 1);
    const targetX = this.friendOriginX + Phaser.Math.Linear(this.startX, this.endX, t);

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: this.friendOriginY + this.baseY - 30,
      scale: 1.12,
      angle: completedSteps % 2 === 0 ? -8 : 8,
      duration: 560,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.x = targetX;
        this.y = this.friendOriginY + this.baseY;
        this.scale = 1;
        this.angle = 0;
        this.startIdle();
      },
    });
  }

  encourage(): void {
    this.stopIdle();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      angle: {
        from: -6,
        to: 6,
      },
      duration: 110,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.angle = 0;
        this.startIdle();
      },
    });
  }

  comboDance(): void {
    this.stopIdle();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: this.friendOriginY + this.baseY - 38,
      scale: 1.24,
      angle: -12,
      duration: 340,
      yoyo: true,
      repeat: 2,
      ease: "Back.easeOut",
      onComplete: () => {
        this.y = this.friendOriginY + this.baseY;
        this.scale = 1;
        this.angle = 0;
        this.startIdle();
      },
    });
  }

  wonder(): void {
    this.stopIdle();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: this.friendOriginY + this.baseY - 12,
      scale: 1.08,
      angle: 5,
      duration: 190,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.y = this.friendOriginY + this.baseY;
        this.scale = 1;
        this.angle = 0;
        this.startIdle();
      },
    });
  }

  private startIdle(): void {
    this.stopIdle();
    this.idleTween = this.scene.tweens.add({
      targets: this,
      y: this.friendOriginY + this.baseY - 5,
      scale: 1.03,
      duration: 920,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private stopIdle(): void {
    this.idleTween?.stop();
    this.idleTween = undefined;
  }
}
