import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_HEIGHT, GAME_WIDTH, UI_FONT } from "../data/gameConfig";
import { RewardSystem } from "../systems/RewardSystem";
import { RescueBridge } from "../ui/RescueBridge";
import { addStageBackdrop } from "../utils/art";
import { centerX } from "../utils/layout";

interface ResultData {
  correctAnswers?: number;
  totalQuestions?: number;
  score?: number;
  bestCombo?: number;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  create(data: ResultData): void {
    this.drawBackground();
    this.drawCompletedBridge();
    this.createCrossingFriend();
    this.createTitle();
    this.createSoftSummary(data);
    this.playConfettiRain();
    new RewardSystem(this).playResultBurst(centerX, 158);
    this.createRestartButton();
  }

  private createTitle(): void {
    const title = this.add
      .text(centerX, 40, "Bridge complete!", {
        color: "#203147",
        fontFamily: UI_FONT,
        fontSize: "34px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    title.setDepth(20);
    title.setScale(0.82);
    this.tweens.add({
      targets: title,
      scale: 1,
      duration: 360,
      ease: "Back.easeOut",
    });

    this.add
      .text(centerX, 78, "The squirrel made it across", {
        color: "#4b6378",
        fontFamily: UI_FONT,
        fontSize: "19px",
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  private createSoftSummary(data: ResultData): void {
    const totalQuestions = data.totalQuestions ?? 8;
    const correctAnswers = data.correctAnswers ?? totalQuestions;
    const summary = this.add.container(170, 318);
    summary.setDepth(20);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.white, 0.8);
    panel.fillCircle(-96, 0, 30);
    panel.fillCircle(-58, -8, 38);
    panel.fillCircle(-16, 0, 30);
    panel.fillCircle(24, -6, 34);
    panel.fillCircle(72, 0, 32);
    panel.fillRoundedRect(-124, -2, 248, 48, 24);
    panel.lineStyle(4, COLORS.white, 0.6);
    panel.strokeRoundedRect(-116, 2, 232, 40, 20);

    const rescueSteps = this.add
      .text(0, -4, `${correctAnswers}/${totalQuestions} rescue steps`, {
        color: "#203147",
        fontFamily: UI_FONT,
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const score = this.add
      .text(0, 24, `Score ${data.score ?? correctAnswers * 10}  Best ${data.bestCombo ?? correctAnswers}`, {
        color: "#4b6378",
        fontFamily: UI_FONT,
        fontSize: "16px",
      })
      .setOrigin(0.5);

    summary.add([panel, rescueSteps, score]);
    summary.setAlpha(0);
    summary.setScale(0.86);
    this.tweens.add({
      targets: summary,
      alpha: 1,
      scale: 1,
      delay: 560,
      duration: 360,
      ease: "Back.easeOut",
    });
  }

  private drawBackground(): void {
    addStageBackdrop(this, { key: ART_KEYS.backgroundBridgeStage, y: GAME_HEIGHT / 2, coverPadding: 0, overlayAlpha: 0.08 });
    const graphics = this.add.graphics();
    graphics.setDepth(-6);
    graphics.fillStyle(COLORS.white, 0.14);
    graphics.fillEllipse(centerX, 204, 760, 210);
    graphics.fillStyle(0x5fd5e8, 0.1);
    graphics.fillRoundedRect(122, 280, GAME_WIDTH - 244, 90, 44);
    graphics.fillStyle(COLORS.white, 0.16);
    graphics.fillEllipse(226, 318, 258, 30);
    graphics.fillEllipse(608, 318, 258, 26);
  }

  private drawCompletedBridge(): void {
    const bridge = new RescueBridge(this, centerX, 196);
    bridge.setDepth(10);
    bridge.setProgress(8);
  }

  private createCrossingFriend(): void {
    const friend = this.add.container(130, 214);
    friend.setDepth(12);
    const shadow = this.add.ellipse(0, 42, 58, 13, COLORS.shadow, 0.14);
    const body = this.add.image(0, -4, ART_KEYS.rescueBuddy).setDisplaySize(104, 104);
    friend.add([shadow, body]);

    this.tweens.add({
      targets: friend,
      x: GAME_WIDTH - 150,
      duration: 1160,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.tweens.add({
          targets: friend,
          y: 188,
          scale: 1.12,
          angle: -10,
          duration: 210,
          yoyo: true,
          repeat: 1,
          ease: "Back.easeOut",
          onComplete: () => {
            friend.y = 214;
            friend.scale = 1;
            friend.angle = 0;
          },
        });
      },
    });

    this.tweens.add({
      targets: friend,
      y: 192,
      duration: 220,
      yoyo: true,
      repeat: 5,
      ease: "Sine.easeOut",
    });

    const bubble = this.add.container(GAME_WIDTH - 180, 118);
    bubble.setDepth(18);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.white, 0.9);
    panel.fillRoundedRect(-48, -26, 96, 52, 24);
    panel.fillTriangle(-22, 14, -8, 40, 12, 18);
    const label = this.add
      .text(0, -2, "Yay!", {
        color: "#203147",
        fontFamily: UI_FONT,
        fontSize: "23px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    bubble.add([panel, label]);
    bubble.setAlpha(0);
    bubble.setScale(0.8);
    this.tweens.add({
      targets: bubble,
      alpha: 1,
      scale: 1,
      delay: 740,
      duration: 240,
      ease: "Back.easeOut",
    });
  }

  private playConfettiRain(): void {
    for (let index = 0; index < 24; index += 1) {
      const plank = this.add.rectangle(
        Phaser.Math.Between(22, GAME_WIDTH - 22),
        Phaser.Math.Between(-40, 120),
        Phaser.Math.Between(12, 22),
        Phaser.Math.Between(6, 10),
        index % 3 === 0 ? COLORS.yellow : index % 3 === 1 ? COLORS.green : COLORS.white,
        0.9,
      );
      plank.setDepth(6);
      plank.setAngle(Phaser.Math.Between(-16, 16));
      this.tweens.add({
        targets: plank,
        y: plank.y + Phaser.Math.Between(180, 300),
        x: plank.x + Phaser.Math.Between(-18, 18),
        angle: plank.angle + Phaser.Math.Between(-38, 38),
        alpha: 0,
        delay: index * 46,
        duration: 1050 + index * 12,
        repeat: -1,
        repeatDelay: 2600,
        ease: "Sine.easeOut",
      });
    }
  }

  private createRestartButton(): void {
    const button = this.add.container(GAME_WIDTH - 158, 318);
    button.setDepth(20);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.shadow, 0.1);
    bg.fillEllipse(8, 12, 250, 84);
    bg.fillStyle(COLORS.cream, 1);
    bg.lineStyle(5, COLORS.yellow, 0.9);
    bg.fillEllipse(0, 0, 250, 84);
    bg.strokeEllipse(0, 0, 250, 84);
    bg.lineStyle(3, COLORS.white, 0.44);
    bg.lineBetween(-82, -14, 82, -14);
    bg.lineStyle(2, COLORS.shadow, 0.12);
    bg.lineBetween(-86, 18, 86, 18);

    const label = this.add
      .text(0, 0, "Play again", {
        color: "#203147",
        fontFamily: UI_FONT,
        fontSize: "27px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(280, 110);
    this.tweens.add({
      targets: button,
      y: 310,
      angle: -2,
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const hitZone = this.add.zone(GAME_WIDTH - 158, 318, 296, 126);
    hitZone.setDepth(21);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on("pointerdown", () => {
      hitZone.disableInteractive();
      this.tweens.killTweensOf(button);
      this.tweens.add({
        targets: button,
        scale: 0.92,
        duration: 80,
        yoyo: true,
        ease: "Sine.easeInOut",
        onComplete: () => this.scene.start("MenuScene"),
      });
    });
  }
}
