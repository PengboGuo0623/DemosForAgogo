import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_RULES } from "../data/gameConfig";

export class RescueFriend extends Phaser.GameObjects.Container {
  private idleTween?: Phaser.Tweens.Tween;
  private readonly buddyImage: Phaser.GameObjects.Image;
  private readonly friendOriginX: number;
  private readonly friendOriginY: number;
  private readonly baseY = 30;
  private restY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.friendOriginX = x;
    this.friendOriginY = y;
    this.restY = y + this.baseY;
    const shadow = scene.add.ellipse(0, 38, 50, 11, COLORS.shadow, 0.18);
    this.buddyImage = scene.add.image(0, -2, ART_KEYS.rescueBuddy).setDisplaySize(84, 84);

    this.add([shadow, this.buddyImage]);
    scene.add.existing(this);
    this.setProgress(0);
  }

  setProgress(completedSteps: number): void {
    this.stopIdle();
    const target = this.getPathPoint(completedSteps);
    this.x = target.x;
    this.y = target.y;
    this.restY = target.y;
    this.scale = 1;
    this.angle = 0;
    this.startIdle();
  }

  hopTo(completedSteps: number): void {
    this.stopIdle();
    const target = this.getPathPoint(completedSteps);

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      x: target.x,
      y: target.y - 16,
      scale: 1.07,
      angle: completedSteps % 2 === 0 ? -4 : 4,
      duration: 460,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.x = target.x;
        this.y = target.y;
        this.restY = target.y;
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
        from: -4,
        to: 4,
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
      y: this.restY - 22,
      scale: 1.12,
      angle: -6,
      duration: 340,
      yoyo: true,
      repeat: 2,
      ease: "Back.easeOut",
      onComplete: () => {
        this.y = this.restY;
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
      y: this.restY - 6,
      scale: 1.04,
      angle: 3,
      duration: 190,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.y = this.restY;
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
      y: this.restY - 2,
      scale: 1.012,
      duration: 1420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private stopIdle(): void {
    this.idleTween?.stop();
    this.idleTween = undefined;
  }

  private getPathPoint(completedSteps: number): { x: number; y: number } {
    const step = Phaser.Math.Clamp(Math.round(completedSteps), 0, GAME_RULES.questionsPerRound);
    const path = [
      { xOffset: -312, yOffset: 30 },
      { xOffset: -155, yOffset: 36 },
      { xOffset: -93, yOffset: 38 },
      { xOffset: -29, yOffset: 39 },
      { xOffset: 33, yOffset: 40 },
      { xOffset: 95, yOffset: 39 },
      { xOffset: 158, yOffset: 36 },
      { xOffset: 221, yOffset: 29 },
      { xOffset: 281, yOffset: 21 },
    ];
    const point = path[step] ?? path[path.length - 1];

    return {
      x: this.friendOriginX + point.xOffset,
      y: this.friendOriginY + point.yOffset,
    };
  }
}
