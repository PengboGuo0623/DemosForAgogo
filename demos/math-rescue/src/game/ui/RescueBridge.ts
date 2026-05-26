import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_RULES } from "../data/gameConfig";
import {
  PATCH_SOURCE_RECT,
  getBridgeRepairTarget,
  getBridgeStageTransform,
  getRevealRatioForSteps,
  type BridgeRepairTarget,
} from "../utils/bridgePath";

interface BridgeTarget {
  x: number;
  y: number;
  angle: number;
}

export class RescueBridge extends Phaser.GameObjects.Container {
  private readonly completionPatch: Phaser.GameObjects.Image;
  private readonly repairLights: Phaser.GameObjects.Container;
  private readonly patchSourceWidth: number;
  private readonly patchSourceHeight: number;
  private readonly backgroundScale: number;
  private readonly backgroundLeft: number;
  private readonly backgroundTop: number;
  private readonly revealState = { value: 0 };
  private completedSteps = 0;

  constructor(scene: Phaser.Scene, _x: number, _y: number) {
    super(scene, 0, 0);

    const patchSource = scene.textures.get(ART_KEYS.bridgeCompletionPatch).getSourceImage() as {
      width: number;
      height: number;
    };
    const stageTransform = getBridgeStageTransform(scene);

    this.patchSourceWidth = patchSource.width;
    this.patchSourceHeight = patchSource.height;
    this.backgroundScale = stageTransform.scale;
    this.backgroundLeft = stageTransform.left;
    this.backgroundTop = stageTransform.top;

    this.completionPatch = scene.add.image(
      this.sourceToCanvasX(PATCH_SOURCE_RECT.x + PATCH_SOURCE_RECT.width / 2),
      this.sourceToCanvasY(PATCH_SOURCE_RECT.y + PATCH_SOURCE_RECT.height / 2),
      ART_KEYS.bridgeCompletionPatch,
    );
    this.completionPatch.setDisplaySize(PATCH_SOURCE_RECT.width * this.backgroundScale, PATCH_SOURCE_RECT.height * this.backgroundScale);
    this.completionPatch.setAlpha(0);
    this.completionPatch.setCrop(0, 0, 1, this.patchSourceHeight);
    this.add(this.completionPatch);

    this.repairLights = scene.add.container(0, 0);
    this.add(this.repairLights);

    scene.add.existing(this);
  }

  setProgress(completedSteps: number): void {
    this.completedSteps = Phaser.Math.Clamp(completedSteps, 0, GAME_RULES.questionsPerRound);
    const nextReveal = this.getRevealRatio(this.completedSteps);
    const previousReveal = this.revealState.value;
    const didAdvance = nextReveal > previousReveal + 0.02;

    this.applyRepairLights();

    this.scene.tweens.killTweensOf(this.revealState);
    this.scene.tweens.add({
      targets: this.revealState,
      value: nextReveal,
      duration: didAdvance ? 520 : 80,
      ease: "Cubic.easeOut",
      onStart: () => {
        if (didAdvance) {
          this.playCleanRevealHead(previousReveal, nextReveal, this.getStoryTarget(this.completedSteps - 1));
        }
      },
      onUpdate: () => this.applyReveal(),
      onComplete: () => {
        this.applyReveal();
        this.applyRepairLights();
        if (didAdvance) {
          this.playRepairBloom(this.getStoryTarget(this.completedSteps - 1), previousReveal, nextReveal);
        }
      },
    });
  }

  getNextPlankTarget(): BridgeTarget {
    const step = Phaser.Math.Clamp(this.completedSteps, 0, GAME_RULES.questionsPerRound - 1);
    const target = this.getStoryTarget(step);

    return {
      x: this.sourceToCanvasX(target.sourceX),
      y: this.sourceToCanvasY(target.sourceY),
      angle: target.angle,
    };
  }

  celebrateStep(): void {
    const target = this.getNextPlankTarget();
    this.playGlow(target.x, target.y, COLORS.yellow, 58, 38);
  }

  celebrateCombo(): void {
    this.playGlow(this.sourceToCanvasX(920), this.sourceToCanvasY(492), COLORS.green, 240, 62);

    for (let index = 0; index < 10; index += 1) {
      const sparkle = this.scene.add.rectangle(
        this.sourceToCanvasX(360 + index * 66),
        this.sourceToCanvasY(424 + Phaser.Math.Between(-18, 36)),
        13,
        7,
        index % 2 === 0 ? COLORS.yellow : COLORS.white,
        0.58,
      );
      sparkle.setDepth(this.depth + 1);
      sparkle.setScale(0.48);
      sparkle.setAngle(Phaser.Math.Between(-12, 12));

      this.scene.tweens.add({
        targets: sparkle,
        y: sparkle.y - Phaser.Math.Between(10, 32),
        scale: 0.76,
        alpha: 0,
        angle: sparkle.angle + Phaser.Math.Between(-28, 28),
        delay: index * 26,
        duration: 620,
        ease: "Sine.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private applyReveal(): void {
    if (this.revealState.value <= 0.01) {
      this.completionPatch.setAlpha(0);
      this.completionPatch.setCrop(0, 0, 1, this.patchSourceHeight);
      return;
    }

    this.completionPatch.setAlpha(1);
    this.completionPatch.setCrop(0, 0, Math.max(1, this.patchSourceWidth * Phaser.Math.Clamp(this.revealState.value, 0, 1)), this.patchSourceHeight);
  }

  private playCleanRevealHead(previousReveal: number, nextReveal: number, target: BridgeRepairTarget): void {
    const startX = this.sourceToCanvasX(PATCH_SOURCE_RECT.x + PATCH_SOURCE_RECT.width * previousReveal);
    const endX = this.sourceToCanvasX(PATCH_SOURCE_RECT.x + PATCH_SOURCE_RECT.width * nextReveal);
    const y = this.sourceToCanvasY(target.sourceY);
    const head = this.scene.add.container(startX, y);
    const art = this.scene.add.graphics();
    const sweepHeight = 56 * this.backgroundScale;

    head.setDepth(this.depth + 5);
    head.setAngle(target.angle);
    art.fillStyle(COLORS.white, 0.2);
    art.fillEllipse(0, 0, 18, sweepHeight);
    art.fillStyle(COLORS.yellow, 0.12);
    art.fillEllipse(-5, 2, 38, sweepHeight * 0.78);
    head.add(art);
    head.setAlpha(0);

    this.scene.tweens.add({
      targets: head,
      x: endX,
      alpha: 0.78,
      duration: 430,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: head,
          alpha: 0,
          duration: 150,
          ease: "Sine.easeIn",
          onComplete: () => head.destroy(true),
        });
      },
    });
  }

  private getRevealRatio(completedSteps: number): number {
    return getRevealRatioForSteps(completedSteps);
  }

  private getStoryTarget(step: number): BridgeRepairTarget {
    return getBridgeRepairTarget(step);
  }

  private sourceToCanvasX(sourceX: number): number {
    return this.backgroundLeft + sourceX * this.backgroundScale;
  }

  private sourceToCanvasY(sourceY: number): number {
    return this.backgroundTop + sourceY * this.backgroundScale;
  }

  private playGlow(x: number, y: number, color: number, width: number, height: number): void {
    const glow = this.scene.add.ellipse(x, y, width, height, color, 0.22);
    glow.setDepth(this.depth + 1);

    this.scene.tweens.add({
      targets: glow,
      scaleX: 1.5,
      scaleY: 1.36,
      alpha: 0,
      duration: 880,
      ease: "Cubic.easeOut",
      onComplete: () => glow.destroy(),
    });
  }

  private applyRepairLights(): void {
    this.repairLights.removeAll(true);

    for (let index = 0; index < this.completedSteps; index += 1) {
      const target = this.getStoryTarget(index);
      const light = this.scene.add.container(this.sourceToCanvasX(target.sourceX), this.sourceToCanvasY(target.sourceY));
      const art = this.scene.add.graphics();
      light.angle = target.angle;
      light.setScale(index >= 6 ? 0.72 : 0.82);
      art.fillStyle(COLORS.yellow, 0.06);
      art.fillEllipse(0, 3, 78, 24);
      art.fillStyle(COLORS.white, 0.08);
      art.fillCircle(-22, -4, 2.4);
      art.fillCircle(22, -1, 2.4);
      light.add(art);
      light.setAlpha(0.32);
      this.repairLights.add(light);
    }
  }

  private playRepairBloom(target: BridgeRepairTarget, previousReveal: number, nextReveal: number): void {
    const x = this.sourceToCanvasX(target.sourceX);
    const y = this.sourceToCanvasY(target.sourceY);
    const angleRad = Phaser.Math.DegToRad(target.angle);
    const tangentX = Math.cos(angleRad);
    const tangentY = Math.sin(angleRad);
    const normalX = Math.cos(angleRad - Math.PI / 2);
    const normalY = Math.sin(angleRad - Math.PI / 2);
    const repairSpan = Phaser.Math.Clamp(Math.abs(nextReveal - previousReveal) * 180, 22, 44);

    const bloom = this.scene.add.container(x, y);
    const bloomArt = this.scene.add.graphics();
    bloom.setDepth(this.depth + 4);
    bloom.setAngle(target.angle);
    bloomArt.fillStyle(COLORS.yellow, 0.15);
    bloomArt.fillEllipse(0, 3, 118, 38);
    bloomArt.fillStyle(COLORS.white, 0.08);
    bloomArt.fillEllipse(-8, -2, 70, 18);
    bloom.add(bloomArt);
    bloom.setScale(0.68);
    bloom.setAlpha(0);

    this.scene.tweens.add({
      targets: bloom,
      alpha: 0.72,
      scaleX: 1.12,
      scaleY: 0.94,
      duration: 220,
      ease: "Sine.easeOut",
      yoyo: true,
      hold: 180,
      onComplete: () => bloom.destroy(true),
    });

    for (let index = 0; index < 8; index += 1) {
      const progress = index / 7;
      const localT = Phaser.Math.Linear(-repairSpan, repairSpan, progress);
      const wave = Math.sin(progress * Math.PI * 2) * Phaser.Math.FloatBetween(3, 8);
      const normalOffset = wave + Phaser.Math.Between(-4, 5);
      const mote = this.scene.add.circle(
        x + tangentX * localT + normalX * normalOffset,
        y + tangentY * localT + normalY * normalOffset,
        Phaser.Math.FloatBetween(2.4, 4.2),
        index % 4 === 0 ? COLORS.white : COLORS.yellow,
        index % 4 === 0 ? 0.38 : 0.3,
      );
      mote.setDepth(this.depth + 6);
      mote.setScale(0.5);

      const driftT = Phaser.Math.Between(-6, 8);
      const driftN = Phaser.Math.Between(10, 22);
      this.scene.tweens.add({
        targets: mote,
        x: mote.x + tangentX * driftT + normalX * driftN,
        y: mote.y + tangentY * driftT + normalY * driftN,
        scale: Phaser.Math.FloatBetween(0.8, 1.08),
        alpha: 0,
        delay: index * 34,
        duration: Phaser.Math.Between(520, 680),
        ease: "Sine.easeOut",
        onComplete: () => mote.destroy(),
      });
    }

    for (let index = 0; index < 2; index += 1) {
      const offsetT = Phaser.Math.Linear(-repairSpan * 0.55, repairSpan * 0.55, index);
      const offsetN = Phaser.Math.Between(-5, 7);
      this.playRepairTwinkle(
        x + tangentX * offsetT + normalX * offsetN,
        y + tangentY * offsetT + normalY * offsetN,
        Phaser.Math.Between(6, 8),
        90 + index * 120,
      );
    }

    this.playRevealSparkle(target);
  }

  private playRepairTwinkle(x: number, y: number, size: number, delay: number): void {
    const star = this.scene.add.graphics();
    star.setPosition(x, y);
    star.setDepth(this.depth + 7);
    star.lineStyle(1.7, COLORS.white, 0.62);
    star.lineBetween(-size, 0, size, 0);
    star.lineBetween(0, -size, 0, size);
    star.lineStyle(1.2, COLORS.yellow, 0.36);
    star.lineBetween(-size * 0.45, -size * 0.45, size * 0.45, size * 0.45);
    star.lineBetween(-size * 0.45, size * 0.45, size * 0.45, -size * 0.45);
    star.setAlpha(0);
    star.setScale(0.32);
    star.setAngle(Phaser.Math.Between(-28, 28));

    this.scene.tweens.add({
      targets: star,
      alpha: 0.7,
      scale: 0.86,
      angle: star.angle + Phaser.Math.Between(24, 42),
      delay,
      duration: 230,
      ease: "Sine.easeOut",
      yoyo: true,
      hold: 70,
      onComplete: () => star.destroy(),
    });
  }

  private playRevealSparkle(target: BridgeRepairTarget): void {
    const x = this.sourceToCanvasX(target.sourceX);
    const y = this.sourceToCanvasY(target.sourceY - 24);

    this.playGlow(x, y, COLORS.white, 58, 28);

    for (let index = 0; index < 4; index += 1) {
      const sparkle = this.scene.add.circle(
        x + Phaser.Math.Between(-32, 32),
        y + Phaser.Math.Between(-8, 18),
        Phaser.Math.FloatBetween(2.2, 3.6),
        index % 4 === 0 ? COLORS.white : COLORS.yellow,
        index % 4 === 0 ? 0.42 : 0.32,
      );
      sparkle.setDepth(this.depth + 2);
      sparkle.setScale(0.48);

      this.scene.tweens.add({
        targets: sparkle,
        y: sparkle.y - Phaser.Math.Between(12, 24),
        x: sparkle.x + Phaser.Math.Between(-10, 10),
        scale: Phaser.Math.FloatBetween(0.76, 1.02),
        alpha: 0,
        delay: index * 50,
        duration: Phaser.Math.Between(500, 640),
        ease: "Sine.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }

    this.playRepairTwinkle(x + Phaser.Math.Between(-24, 24), y + Phaser.Math.Between(-8, 10), 6, 110);
  }
}
