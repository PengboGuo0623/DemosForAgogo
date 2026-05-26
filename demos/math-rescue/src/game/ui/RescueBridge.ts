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
    this.applyRepairLights();

    this.scene.tweens.killTweensOf(this.revealState);
    this.scene.tweens.add({
      targets: this.revealState,
      value: nextReveal,
      duration: Math.abs(nextReveal - this.revealState.value) > 0.02 ? 620 : 80,
      ease: "Cubic.easeInOut",
      onUpdate: () => this.applyReveal(),
      onComplete: () => {
        this.applyReveal();
        this.applyRepairLights();
        if (nextReveal > previousReveal + 0.02) {
          this.playRevealSparkle(this.getStoryTarget(this.completedSteps - 1));
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
    this.completionPatch.setCrop(
      0,
      0,
      Math.max(1, this.patchSourceWidth * Phaser.Math.Clamp(this.revealState.value, 0, 1)),
      this.patchSourceHeight,
    );
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
      art.fillStyle(COLORS.yellow, 0.12);
      art.fillRoundedRect(-48, -13, 96, 26, 13);
      art.fillStyle(COLORS.white, 0.12);
      art.fillRoundedRect(-36, -7, 72, 8, 4);
      art.lineStyle(3, COLORS.white, 0.28);
      art.lineBetween(-32, -4, 32, -4);
      art.lineStyle(2, COLORS.yellow, 0.36);
      art.lineBetween(-28, 6, 28, 6);
      light.add(art);
      light.setAlpha(0.62);
      this.repairLights.add(light);
    }
  }

  private playRevealSparkle(target: BridgeRepairTarget): void {
    const x = this.sourceToCanvasX(target.sourceX);
    const y = this.sourceToCanvasY(target.sourceY - 42);

    this.playGlow(x, y, COLORS.white, 86, 42);

    for (let index = 0; index < 4; index += 1) {
      const sparkle = this.scene.add.rectangle(
        x + Phaser.Math.Between(-36, 36),
        y + Phaser.Math.Between(-20, 18),
        12,
        6,
        index % 2 === 0 ? COLORS.yellow : COLORS.white,
        0.58,
      );
      sparkle.setDepth(this.depth + 2);
      sparkle.setScale(0.42);
      sparkle.setAngle(Phaser.Math.Between(-12, 12));

      this.scene.tweens.add({
        targets: sparkle,
        y: sparkle.y - Phaser.Math.Between(18, 42),
        x: sparkle.x + Phaser.Math.Between(-16, 16),
        scale: 0.72,
        alpha: 0,
        angle: sparkle.angle + Phaser.Math.Between(-28, 28),
        delay: index * 48,
        duration: 620,
        ease: "Sine.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }
  }
}
