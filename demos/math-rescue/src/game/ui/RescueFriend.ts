import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_RULES } from "../data/gameConfig";
import { getBridgeStageTransform, getBuddyPathSourcePoint, type BridgeStageTransform } from "../utils/bridgePath";

interface BuddyPathPoint {
  x: number;
  y: number;
  lean: number;
  deckAngle: number;
  scale: number;
  occlusionAlpha: number;
}

export class RescueFriend extends Phaser.GameObjects.Container {
  private idleTween?: Phaser.Tweens.Tween;
  private readonly contactShadow: Phaser.GameObjects.Ellipse;
  private readonly sunRimImage: Phaser.GameObjects.Image;
  private readonly buddyImage: Phaser.GameObjects.Image;
  private readonly skyWashImage: Phaser.GameObjects.Image;
  private readonly foregroundRope: Phaser.GameObjects.Graphics;
  private readonly stageTransform: BridgeStageTransform;
  private readonly buddyRestY = -6;
  private restY = 0;
  private restScale = 1;
  private restLean = 0;
  private restDeckAngle = 0;
  private restOcclusionAlpha = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.stageTransform = getBridgeStageTransform(scene);
    this.contactShadow = scene.add.ellipse(0, 0, 58, 12, COLORS.shadow, 0.16);
    this.contactShadow.setDepth(15);
    this.sunRimImage = scene.add.image(2, this.buddyRestY - 1, ART_KEYS.rescueBuddy).setDisplaySize(84, 84);
    this.sunRimImage.setTint(0xfff1bd);
    this.sunRimImage.setAlpha(0.13);
    this.sunRimImage.setBlendMode(Phaser.BlendModes.ADD);
    this.buddyImage = scene.add.image(4, this.buddyRestY, ART_KEYS.rescueBuddy).setDisplaySize(84, 84);
    this.buddyImage.setTint(0xfff3dc, 0xfff6e6, 0xd8edf0, 0xd0e9e7);
    this.buddyImage.setAlpha(0.97);
    this.skyWashImage = scene.add.image(4, this.buddyRestY + 1, ART_KEYS.rescueBuddy).setDisplaySize(84, 84);
    this.skyWashImage.setTint(0x8bd8ee);
    this.skyWashImage.setAlpha(0.1);
    this.skyWashImage.setBlendMode(Phaser.BlendModes.SCREEN);
    this.foregroundRope = scene.add.graphics();
    this.drawForegroundRope();

    this.add([this.sunRimImage, this.buddyImage, this.skyWashImage, this.foregroundRope]);
    scene.add.existing(this);
    this.setProgress(0);
  }

  setProgress(completedSteps: number): void {
    this.stopIdle();
    const target = this.getPathPoint(completedSteps);
    this.x = target.x;
    this.y = target.y;
    this.restY = target.y;
    this.restScale = target.scale;
    this.restLean = target.lean;
    this.restDeckAngle = target.deckAngle;
    this.restOcclusionAlpha = target.occlusionAlpha;
    this.setScale(this.restScale);
    this.angle = 0;
    this.resetLayerOffsets();
    this.syncGrounding(0, target);
    this.startIdle();
  }

  hopTo(completedSteps: number, onLanded?: () => void): void {
    this.stopIdle();
    const target = this.getPathPoint(completedSteps);
    const startX = this.x;
    const startY = this.y;
    const startAngle = this.angle;
    const startScaleX = this.scaleX;
    const startScaleY = this.scaleY;
    const distance = Phaser.Math.Distance.Between(startX, startY, target.x, target.y);
    const jump = { t: 0 };
    const hopHeight = Phaser.Math.Clamp(distance * 0.18, 18, 34);
    const travelDuration = Phaser.Math.Clamp(540 + distance * 1.1, 620, 820);
    const wobbleDirection = completedSteps % 2 === 0 ? -1 : 1;

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf([this.sunRimImage, this.buddyImage, this.skyWashImage, this.contactShadow, this.foregroundRope]);
    this.scene.tweens.add({
      targets: this,
      scaleX: startScaleX * 0.96,
      scaleY: startScaleY * 1.06,
      duration: 110,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: [this.sunRimImage, this.buddyImage, this.skyWashImage],
      y: this.buddyRestY - 4,
      angle: wobbleDirection * -4,
      delay: 80,
      duration: travelDuration * 0.45,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: jump,
      t: 1,
      delay: 110,
      duration: travelDuration,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const t = jump.t;
        const lift = Math.sin(t * Math.PI);
        const baseScale = Phaser.Math.Linear(startScaleX, target.scale, t);
        const motionPoint = {
          ...target,
          scale: baseScale,
          occlusionAlpha: Phaser.Math.Linear(this.restOcclusionAlpha, target.occlusionAlpha, t),
        };
        this.x = Phaser.Math.Linear(startX, target.x, t);
        this.y = Phaser.Math.Linear(startY, target.y, t) - lift * hopHeight;
        this.scaleX = baseScale * (1 + lift * 0.035);
        this.scaleY = Phaser.Math.Linear(startScaleY, target.scale, t) * (1 - lift * 0.02);
        this.angle = Phaser.Math.Linear(startAngle, target.lean, t) + Math.sin(t * Math.PI * 2) * wobbleDirection * 2.2;
        this.syncGrounding(lift, motionPoint);
      },
      onComplete: () => {
        this.x = target.x;
        this.y = target.y;
        this.restY = target.y;
        this.restScale = target.scale;
        this.restLean = target.lean;
        this.restDeckAngle = target.deckAngle;
        this.restOcclusionAlpha = target.occlusionAlpha;
        this.resetLayerOffsets();
        this.syncGrounding(0, target);
        this.scene.tweens.add({
          targets: this,
          scaleX: { from: target.scale * 1.08, to: target.scale },
          scaleY: { from: target.scale * 0.92, to: target.scale },
          angle: { from: target.lean * 0.45, to: 0 },
          duration: 190,
          ease: "Back.easeOut",
          onComplete: () => {
            this.setScale(this.restScale);
            this.angle = 0;
            this.syncGrounding(0);
            if (onLanded) {
              onLanded();
              return;
            }
            this.startIdle();
          },
        });
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
        this.setScale(this.restScale);
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
      scale: this.restScale * 1.12,
      angle: -6,
      duration: 340,
      yoyo: true,
      repeat: 2,
      ease: "Back.easeOut",
      onUpdate: () => this.syncGrounding(0),
      onComplete: () => {
        this.y = this.restY;
        this.setScale(this.restScale);
        this.angle = 0;
        this.syncGrounding(0);
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
      scale: this.restScale * 1.04,
      angle: 3,
      duration: 190,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.y = this.restY;
        this.setScale(this.restScale);
        this.angle = 0;
        this.syncGrounding(0);
        this.startIdle();
      },
    });
  }

  private startIdle(): void {
    this.stopIdle();
    this.idleTween = this.scene.tweens.add({
      targets: this,
      y: this.restY - 2,
      scaleX: this.restScale * 1.012,
      scaleY: this.restScale * 0.992,
      duration: 1420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onUpdate: () => this.syncGrounding(0),
    });
  }

  private stopIdle(): void {
    this.idleTween?.stop();
    this.idleTween = undefined;
    this.scene.tweens.killTweensOf([this.sunRimImage, this.buddyImage, this.skyWashImage, this.contactShadow, this.foregroundRope]);
    this.resetLayerOffsets();
  }

  private getPathPoint(completedSteps: number): BuddyPathPoint {
    const step = Phaser.Math.Clamp(Math.round(completedSteps), 0, GAME_RULES.questionsPerRound);
    const point = getBuddyPathSourcePoint(step);

    return {
      x: this.stageTransform.sourceToCanvasX(point.sourceX),
      y: this.stageTransform.sourceToCanvasY(point.sourceY),
      lean: point.lean,
      deckAngle: point.deckAngle,
      scale: point.scale,
      occlusionAlpha: point.occlusionAlpha,
    };
  }

  private resetLayerOffsets(): void {
    this.sunRimImage.setPosition(2, this.buddyRestY - 1);
    this.buddyImage.setPosition(4, this.buddyRestY);
    this.skyWashImage.setPosition(4, this.buddyRestY + 1);
    this.sunRimImage.setAngle(0);
    this.buddyImage.setAngle(0);
    this.skyWashImage.setAngle(0);
    this.foregroundRope.setAlpha(this.restOcclusionAlpha);
  }

  private syncGrounding(lift: number, point?: BuddyPathPoint): void {
    const deckAngle = point?.deckAngle ?? this.restDeckAngle;
    const occlusionAlpha = point?.occlusionAlpha ?? this.restOcclusionAlpha;
    const baseScale = point?.scale ?? this.restScale;
    const shadowAlpha = Phaser.Math.Clamp((occlusionAlpha > 0 ? 0.2 : 0.11) * (1 - lift * 0.55), 0.04, 0.22);

    this.contactShadow.setPosition(this.x - 2 * this.scaleX, this.y + 36 * this.scaleY);
    this.contactShadow.setAngle(deckAngle);
    this.contactShadow.setScale(baseScale * (1 + lift * 0.18), baseScale * (0.92 - lift * 0.34));
    this.contactShadow.setAlpha(shadowAlpha);
    this.foregroundRope.setAlpha(Phaser.Math.Clamp(occlusionAlpha * (1 - lift * 0.45), 0, 0.72));
  }

  private drawForegroundRope(): void {
    this.foregroundRope.clear();
    this.foregroundRope.lineStyle(5, 0x7b5a35, 0.36);
    this.foregroundRope.beginPath();
    this.foregroundRope.moveTo(-22, 29);
    this.foregroundRope.lineTo(-6, 32);
    this.foregroundRope.lineTo(12, 31);
    this.foregroundRope.lineTo(28, 29);
    this.foregroundRope.strokePath();
    this.foregroundRope.lineStyle(2, 0xf5d092, 0.24);
    this.foregroundRope.beginPath();
    this.foregroundRope.moveTo(-18, 27);
    this.foregroundRope.lineTo(-4, 29);
    this.foregroundRope.lineTo(13, 28);
    this.foregroundRope.lineTo(25, 27);
    this.foregroundRope.strokePath();
    this.foregroundRope.fillStyle(0x6c4a28, 0.22);
    this.foregroundRope.fillRoundedRect(-15, 31, 32, 4, 2);
  }

  destroy(fromScene?: boolean): void {
    this.contactShadow.destroy(fromScene);
    super.destroy(fromScene);
  }
}
