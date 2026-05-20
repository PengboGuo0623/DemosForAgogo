import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_HEIGHT, GAME_WIDTH } from "../data/gameConfig";
import { RewardSystem } from "../systems/RewardSystem";
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
    this.playStarRain();
    new RewardSystem(this).playResultBurst(centerX, 360);
    this.createRestartButton();
  }

  private createTitle(): void {
    const title = this.add
      .text(centerX, 92, "Bridge complete!", {
        color: "#203147",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "37px",
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
      .text(centerX, 138, "All the friends made it across", {
        color: "#4b6378",
        fontFamily: "Arial, sans-serif",
        fontSize: "19px",
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  private createSoftSummary(data: ResultData): void {
    const totalQuestions = data.totalQuestions ?? 8;
    const correctAnswers = data.correctAnswers ?? totalQuestions;
    const summary = this.add.container(centerX, 632);
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
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const score = this.add
      .text(0, 24, `Score ${data.score ?? correctAnswers * 10}  Best ${data.bestCombo ?? correctAnswers}`, {
        color: "#4b6378",
        fontFamily: "Arial, sans-serif",
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
    graphics.fillEllipse(centerX, 340, 540, 400);
    graphics.fillStyle(0x5fd5e8, 0.1);
    graphics.fillRoundedRect(-8, 468, GAME_WIDTH + 16, 188, 74);
    graphics.fillStyle(COLORS.white, 0.16);
    graphics.fillEllipse(126, 514, 258, 30);
    graphics.fillEllipse(292, 582, 258, 26);
  }

  private drawCompletedBridge(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.white, 0.26);
    graphics.fillRoundedRect(74, 456, 242, 46, 22);
    graphics.lineStyle(3, COLORS.white, 0.4);
    graphics.lineBetween(90, 472, 300, 472);
    graphics.lineBetween(96, 488, 294, 488);

    graphics.fillStyle(COLORS.cream, 1);
    graphics.lineStyle(3, COLORS.yellow, 0.86);
    for (let index = 0; index < 8; index += 1) {
      const x = centerX - 96 + index * 28;
      this.add.image(x, 416, ART_KEYS.bridgePlankFilled).setDisplaySize(24, 88).setDepth(10);
    }
  }

  private createCrossingFriend(): void {
    const friend = this.add.container(centerX - 132, 376);
    friend.setDepth(12);
    const shadow = this.add.ellipse(0, 58, 76, 16, COLORS.shadow, 0.14);
    const body = this.add.image(0, -4, ART_KEYS.starFriendBody).setDisplaySize(152, 144);
    friend.add([shadow, body]);

    this.tweens.add({
      targets: friend,
      x: centerX + 116,
      duration: 1160,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.tweens.add({
          targets: friend,
          y: 338,
          scale: 1.16,
          angle: -10,
          duration: 210,
          yoyo: true,
          repeat: 1,
          ease: "Back.easeOut",
          onComplete: () => {
            friend.y = 376;
            friend.scale = 1;
            friend.angle = 0;
          },
        });
      },
    });

    this.tweens.add({
      targets: friend,
      y: 350,
      duration: 220,
      yoyo: true,
      repeat: 5,
      ease: "Sine.easeOut",
    });

    const bubble = this.add.container(centerX + 68, 300);
    bubble.setDepth(18);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.white, 0.9);
    panel.fillRoundedRect(-48, -26, 96, 52, 24);
    panel.fillTriangle(-22, 14, -8, 40, 12, 18);
    const label = this.add
      .text(0, -2, "Yay!", {
        color: "#203147",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
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

  private playStarRain(): void {
    for (let index = 0; index < 30; index += 1) {
      const star = this.add.star(
        Phaser.Math.Between(22, GAME_WIDTH - 22),
        Phaser.Math.Between(-60, 190),
        5,
        4,
        12,
        index % 3 === 0 ? COLORS.yellow : index % 3 === 1 ? COLORS.green : COLORS.white,
        0.9,
      );
      star.setDepth(6);
      star.setScale(Phaser.Math.FloatBetween(0.4, 0.9));
      this.tweens.add({
        targets: star,
        y: star.y + Phaser.Math.Between(320, 560),
        x: star.x + Phaser.Math.Between(-26, 26),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        delay: index * 46,
        duration: 1200 + index * 14,
        repeat: -1,
        repeatDelay: 2600,
        ease: "Cubic.easeOut",
      });
    }
  }

  private createRestartButton(): void {
    const button = this.add.container(centerX, 744);
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
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "27px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(280, 110);
    this.tweens.add({
      targets: button,
      y: 734,
      angle: -2,
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const hitZone = this.add.zone(centerX, 744, 296, 126);
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
