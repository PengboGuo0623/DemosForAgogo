import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_HEIGHT, GAME_RULES, GAME_WIDTH } from "../data/gameConfig";

interface BridgeTarget {
  x: number;
  y: number;
  angle: number;
}

const PATCH_SOURCE_RECT = {
  x: 170,
  y: 640,
  width: 520,
  height: 380,
} as const;

export class RescueBridge extends Phaser.GameObjects.Container {
  private readonly completionPatch: Phaser.GameObjects.Image;
  private readonly patchSourceWidth: number;
  private readonly patchSourceHeight: number;
  private readonly backgroundScale: number;
  private readonly backgroundTop: number;
  private readonly revealState = { value: 0 };
  private completedSteps = 0;

  constructor(scene: Phaser.Scene, _x: number, _y: number) {
    super(scene, 0, 0);

    const backgroundSource = scene.textures.get(ART_KEYS.backgroundBridgeStage).getSourceImage() as {
      width: number;
      height: number;
    };
    const patchSource = scene.textures.get(ART_KEYS.bridgeCompletionPatch).getSourceImage() as {
      width: number;
      height: number;
    };

    this.patchSourceWidth = patchSource.width;
    this.patchSourceHeight = patchSource.height;
    this.backgroundScale = Math.max(GAME_WIDTH / backgroundSource.width, GAME_HEIGHT / backgroundSource.height);
    this.backgroundTop = GAME_HEIGHT / 2 - (backgroundSource.height * this.backgroundScale) / 2;

    this.completionPatch = scene.add.image(
      this.sourceToCanvasX(PATCH_SOURCE_RECT.x + PATCH_SOURCE_RECT.width / 2),
      this.sourceToCanvasY(PATCH_SOURCE_RECT.y + PATCH_SOURCE_RECT.height / 2),
      ART_KEYS.bridgeCompletionPatch,
    );
    this.completionPatch.setDisplaySize(PATCH_SOURCE_RECT.width * this.backgroundScale, PATCH_SOURCE_RECT.height * this.backgroundScale);
    this.completionPatch.setAlpha(0);
    this.completionPatch.setCrop(0, 0, 1, this.patchSourceHeight);
    this.add(this.completionPatch);

    scene.add.existing(this);
  }

  setProgress(completedSteps: number): void {
    this.completedSteps = Phaser.Math.Clamp(completedSteps, 0, GAME_RULES.questionsPerRound);
    const nextReveal = this.getRevealRatio(this.completedSteps);

    this.scene.tweens.killTweensOf(this.revealState);
    this.scene.tweens.add({
      targets: this.revealState,
      value: nextReveal,
      duration: Math.abs(nextReveal - this.revealState.value) > 0.02 ? 720 : 80,
      ease: "Sine.easeInOut",
      onUpdate: () => this.applyReveal(),
      onComplete: () => this.applyReveal(),
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
    this.playGlow(target.x, target.y, COLORS.yellow, 46, 34);
  }

  celebrateCombo(): void {
    this.playGlow(this.sourceToCanvasX(430), this.sourceToCanvasY(814), COLORS.green, 158, 54);

    for (let index = 0; index < 10; index += 1) {
      const sparkle = this.scene.add.star(
        this.sourceToCanvasX(302 + index * 28),
        this.sourceToCanvasY(765 + Phaser.Math.Between(-16, 24)),
        5,
        3,
        9,
        index % 2 === 0 ? COLORS.yellow : COLORS.white,
        0.8,
      );
      sparkle.setDepth(this.depth + 1);
      sparkle.setScale(0.24);

      this.scene.tweens.add({
        targets: sparkle,
        y: sparkle.y - Phaser.Math.Between(10, 32),
        scale: 0.9,
        alpha: 0,
        angle: Phaser.Math.Between(-90, 90),
        delay: index * 34,
        duration: 620,
        ease: "Cubic.easeOut",
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
    if (completedSteps < 3) {
      return 0;
    }

    if (completedSteps === 3) {
      return 0.56;
    }

    if (completedSteps === 4) {
      return 0.78;
    }

    return 1;
  }

  private getStoryTarget(step: number): { sourceX: number; sourceY: number; angle: number } {
    const targets = [
      { sourceX: 430, sourceY: 734, angle: -8 },
      { sourceX: 430, sourceY: 782, angle: 6 },
      { sourceX: 340, sourceY: 846, angle: -7 },
      { sourceX: 430, sourceY: 846, angle: 0 },
      { sourceX: 520, sourceY: 846, angle: 7 },
      { sourceX: 430, sourceY: 780, angle: -3 },
      { sourceX: 524, sourceY: 780, angle: 6 },
      { sourceX: 610, sourceY: 838, angle: 10 },
    ];

    return targets[step] ?? targets[targets.length - 1];
  }

  private sourceToCanvasX(sourceX: number): number {
    return sourceX * this.backgroundScale;
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
      duration: 620,
      ease: "Cubic.easeOut",
      onComplete: () => glow.destroy(),
    });
  }
}
