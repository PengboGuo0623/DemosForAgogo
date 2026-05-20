import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_HEIGHT, GAME_WIDTH, GAME_RULES, UI_FONT, type MathQuestion } from "../data/gameConfig";
import { QuestionGenerator } from "../systems/QuestionGenerator";
import { RewardSystem } from "../systems/RewardSystem";
import { ComboBanner } from "../ui/ComboBanner";
import { NumberPlank } from "../ui/NumberPlank";
import { ProgressBar } from "../ui/ProgressBar";
import { RescueBridge } from "../ui/RescueBridge";
import { RescueFriend } from "../ui/RescueFriend";
import { StoryBubble } from "../ui/StoryBubble";
import { addStageBackdrop } from "../utils/art";
import { centerX } from "../utils/layout";

export class PlayScene extends Phaser.Scene {
  private readonly questionGenerator = new QuestionGenerator();
  private planks: NumberPlank[] = [];
  private banner?: ComboBanner;
  private bridge?: RescueBridge;
  private rescueFriend?: RescueFriend;
  private progressBar?: ProgressBar;
  private rewardSystem?: RewardSystem;
  private storyContainer?: Phaser.GameObjects.Container;
  private equationPlate?: Phaser.GameObjects.Graphics;
  private equationText?: Phaser.GameObjects.Text;
  private helperText?: Phaser.GameObjects.Text;
  private storyBubble?: StoryBubble;
  private helperPlate?: Phaser.GameObjects.Graphics;
  private waterForeground?: Phaser.GameObjects.Graphics;
  private scoreText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private questionCounterText?: Phaser.GameObjects.Text;
  private choiceCue?: Phaser.GameObjects.Container;
  private progressDots: Phaser.GameObjects.Arc[] = [];
  private questions: MathQuestion[] = [];
  private currentQuestionIndex = 0;
  private questionsAnswered = 0;
  private correctAnswers = 0;
  private score = 0;
  private combo = 0;
  private bestCombo = 0;
  private isResolvingAnswer = false;

  constructor() {
    super("PlayScene");
  }

  create(): void {
    this.rewardSystem = new RewardSystem(this);
    this.questions = this.questionGenerator.createRound();
    this.currentQuestionIndex = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.isResolvingAnswer = false;

    this.drawBackground();
    this.createWaterForeground();
    this.createBridgeScene();
    this.drawHud();
    this.banner = new ComboBanner(this, centerX, 78);
    this.createMathStoryArea();
    this.storyBubble = new StoryBubble(this);
    this.storyBubble.setDepth(32);
    this.cameras.main.fadeIn(260, 255, 255, 255);
    this.showCurrentQuestion();
  }

  private drawBackground(): void {
    addStageBackdrop(this, { key: ART_KEYS.backgroundBridgeStage, y: GAME_HEIGHT / 2, coverPadding: 0, overlayAlpha: 0.02 });
    const graphics = this.add.graphics();
    graphics.setDepth(-10);
    graphics.fillStyle(COLORS.white, 0.08);
    graphics.fillEllipse(centerX, 214, 780, 118);
    graphics.fillStyle(0x62dff0, 0.06);
    graphics.fillRoundedRect(132, 286, GAME_WIDTH - 264, 84, 42);

    for (let index = 0; index < 18; index += 1) {
      const x = Phaser.Math.Between(36, GAME_WIDTH - 36);
      const y = Phaser.Math.Between(42, GAME_HEIGHT - 62);
      const sparkle = this.add.star(x, y, 5, 2, 5, COLORS.white, 0.44);
      sparkle.setDepth(-4);
      this.tweens.add({
        targets: sparkle,
        alpha: 0.12,
        scale: 1.5,
        duration: 920 + index * 54,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private createBridgeScene(): void {
    this.bridge = new RescueBridge(this, centerX, 196);
    this.bridge.setDepth(12);
    this.rescueFriend = new RescueFriend(this, centerX, 184);
    this.rescueFriend.setDepth(16);
  }

  private drawHud(): void {
    this.scoreText = this.add
      .text(30, 24, "Score 0", {
        color: "#203147",
        fontFamily: UI_FONT,
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)
      .setAlpha(0);

    this.comboText = this.add
      .text(GAME_WIDTH - 30, 24, "Streak 0", {
        color: "#203147",
        fontFamily: UI_FONT,
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5)
      .setAlpha(0);

    this.progressBar = new ProgressBar(this, centerX, 26);
    this.progressBar.setProgress(0);
    this.progressBar.setAlpha(0);
    this.createStoryDots();
  }

  private createMathStoryArea(): void {
    this.questionCounterText = this.add
      .text(centerX, 24, "Scene 1/8", {
        color: "#4b6378",
        fontFamily: UI_FONT,
        fontSize: "18px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.storyContainer = this.add.container(centerX, 108);
    this.storyContainer.setDepth(14);
    this.equationPlate = this.add.graphics();
    this.equationPlate.setDepth(15);
    this.drawEquationPlate();
    this.equationText = this.add
      .text(centerX, 164, "", {
        color: "#4b6378",
        fontFamily: UI_FONT,
        fontSize: "17px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(16);

    this.helperPlate = this.add.graphics();
    this.helperPlate.setDepth(29);
    this.drawHelperPlate();
    this.helperText = this.add
      .text(centerX, 282, "Send a plank", {
        color: "#4b6378",
        fontFamily: UI_FONT,
        fontSize: "15px",
        align: "center",
        stroke: "#ffffff",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(30);
    this.helperPlate.setAlpha(0);
  }

  private drawEquationPlate(): void {
    if (!this.equationPlate) {
      return;
    }

    const x = centerX;
    const y = 164;
    this.equationPlate.clear();
    this.equationPlate.fillStyle(COLORS.shadow, 0.06);
    this.equationPlate.fillRoundedRect(x - 50, y - 15, 100, 32, 16);
    this.equationPlate.fillStyle(COLORS.white, 0.62);
    this.equationPlate.fillRoundedRect(x - 48, y - 18, 96, 32, 16);
    this.equationPlate.lineStyle(2, COLORS.white, 0.46);
    this.equationPlate.strokeRoundedRect(x - 42, y - 13, 84, 22, 11);
    this.equationPlate.setAlpha(0);
  }

  private drawHelperPlate(): void {
    if (!this.helperPlate) {
      return;
    }

    this.helperPlate.clear();
    const x = centerX;
    const y = 282;
    this.helperPlate.fillStyle(COLORS.shadow, 0.1);
    this.helperPlate.fillRoundedRect(x - 102, y - 12, 204, 30, 15);
    this.helperPlate.fillStyle(COLORS.white, 0.58);
    this.helperPlate.fillRoundedRect(x - 98, y - 16, 196, 30, 15);
    this.helperPlate.lineStyle(2, COLORS.white, 0.42);
    this.helperPlate.strokeRoundedRect(x - 86, y - 10, 172, 18, 9);
  }

  private createWaterForeground(): void {
    this.waterForeground = this.add.graphics();
    this.waterForeground.setDepth(3);
    this.drawWaterForeground();
  }

  private drawWaterForeground(): void {
    if (!this.waterForeground) {
      return;
    }

    this.waterForeground.clear();
    this.waterForeground.fillStyle(COLORS.white, 0.1);
    this.waterForeground.fillEllipse(248, 326, 138, 18);
    this.waterForeground.fillEllipse(422, 342, 148, 18);
    this.waterForeground.fillEllipse(596, 326, 138, 16);
    this.waterForeground.lineStyle(3, COLORS.white, 0.1);
    this.waterForeground.lineBetween(176, 331, 318, 331);
    this.waterForeground.lineBetween(350, 346, 494, 346);
    this.waterForeground.lineBetween(528, 331, 674, 331);
  }

  private showCurrentQuestion(): void {
    const question = this.questions[this.currentQuestionIndex];

    if (!question || !this.equationText || !this.helperText || !this.questionCounterText || !this.progressBar) {
      return;
    }

    this.isResolvingAnswer = true;
    this.clearPlanks();
    this.clearChoiceCue();
    this.storyBubble?.hideNow();
    this.renderMathStory(question);
    this.equationText.setText(`${question.left} ${question.operator} ${question.right}`);
    this.helperText.setText(this.getHelperPrompt());
    this.helperText.setAlpha(0);
    this.helperPlate?.setAlpha(0);
    this.questionCounterText.setText(`Scene ${this.currentQuestionIndex + 1}/${GAME_RULES.questionsPerRound}`);
    this.progressBar.setProgress(this.questionsAnswered / GAME_RULES.questionsPerRound);
    this.updateStoryDots();
    this.bridge?.setProgress(this.questionsAnswered);
    this.rescueFriend?.setProgress(this.questionsAnswered);
    this.animateQuestionBeat();
    this.playQuestionIntro(question);
  }

  private createStoryDots(): void {
    const startX = centerX - 94;
    this.progressDots = [];

    for (let index = 0; index < GAME_RULES.questionsPerRound; index += 1) {
      const dot = this.add.circle(startX + index * 27, 25, 4.8, COLORS.white, 0.66);
      dot.setStrokeStyle(2, COLORS.white, 0.38);
      this.progressDots.push(dot);
    }
  }

  private updateStoryDots(): void {
    this.progressDots.forEach((dot, index) => {
      const isDone = index < this.questionsAnswered;
      const isNow = index === this.questionsAnswered;
      dot.setFillStyle(isDone ? COLORS.yellow : COLORS.white, isDone ? 0.96 : 0.62);
      dot.setStrokeStyle(2, isNow ? COLORS.yellow : COLORS.white, isNow ? 0.86 : 0.38);
      dot.setScale(isNow ? 1.24 : 1);
    });
  }

  private animateQuestionBeat(): void {
    if (!this.storyContainer || !this.equationText || !this.equationPlate) {
      return;
    }

    this.storyContainer.setAlpha(0);
    this.storyContainer.setScale(0.88);
    this.storyContainer.y = 118;
    this.equationText.setAlpha(0);
    this.equationPlate.setAlpha(0);
    this.tweens.add({
      targets: this.storyContainer,
      alpha: 1,
      scale: 1,
      y: 108,
      duration: 780,
      ease: "Cubic.easeOut",
    });
    this.tweens.add({
      targets: [this.equationText, this.equationPlate],
      alpha: 0.92,
      delay: 540,
      duration: 420,
      ease: "Sine.easeOut",
    });
  }

  private playQuestionIntro(question: MathQuestion): void {
    this.rescueFriend?.wonder();
    this.showFriendBubble(this.getIntroBubble(), COLORS.white, 1180);
    this.playGuideSpark();

    this.time.delayedCall(1080, () => {
      this.drawNumberPlanks(question);
    });

    this.time.delayedCall(2460, () => {
      this.isResolvingAnswer = false;
      this.helperText?.setText(this.getHelperPrompt());
      this.tweens.add({
        targets: [this.helperText, this.helperPlate],
        alpha: 0.72,
        duration: 260,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.helperText?.setAlpha(0.72);
          this.helperPlate?.setAlpha(0.72);
          this.time.delayedCall(680, () => {
            if (!this.isResolvingAnswer) {
              this.tweens.add({
                targets: [this.helperText, this.helperPlate],
                alpha: 0.1,
                duration: 420,
                ease: "Sine.easeInOut",
              });
            }
          });
        },
      });
      this.playChoiceCue();
    });
  }

  private showFriendBubble(message: string, tint: number = COLORS.white, hideDelay = 620): void {
    this.storyBubble?.show(message, 172, 102, tint);
    this.storyBubble?.hide(hideDelay);
  }

  private getIntroBubble(): string {
    return [
      "Bridge glow!",
      "First light!",
      "More light!",
      "Bridge grows!",
      "Keep going!",
      "Last planks!",
      "Across soon!",
      "One glow!",
    ][this.currentQuestionIndex] ?? "Go!";
  }

  private getHelperPrompt(): string {
    if (this.currentQuestionIndex < 6) {
      return "Send a plank";
    }

    if (this.currentQuestionIndex < 7) {
      return "Guide the star";
    }

    return "Last plank";
  }

  private getCorrectBubble(): string {
    if (this.currentQuestionIndex < 6) {
      return "Glow!";
    }

    if (this.currentQuestionIndex < 7) {
      return "Step!";
    }

    return "Made it!";
  }

  private playGuideSpark(): void {
    const friendX = this.rescueFriend?.x ?? centerX - 138;
    const friendY = this.rescueFriend?.y ?? 190;
    const bridgeTarget = this.bridge?.getNextPlankTarget() ?? { x: centerX, y: 248 };
    const spark = this.add.star(friendX + 24, friendY - 12, 5, 5, 12, COLORS.yellow, 0.95);
    spark.setDepth(22);
    spark.setScale(0.45);

    this.tweens.add({
      targets: spark,
      x: bridgeTarget.x,
      y: bridgeTarget.y - 12,
      scale: 1.08,
      angle: 180,
      duration: 1180,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.playBridgeTargetGlow(bridgeTarget.x, bridgeTarget.y);
        spark.destroy();
      },
    });

    for (let index = 0; index < 5; index += 1) {
      const twinkle = this.add.star(friendX + 22, friendY - 12, 5, 2, 6, COLORS.white, 0.72);
      twinkle.setDepth(22);
      twinkle.setScale(0.2);

      this.tweens.add({
        targets: twinkle,
        x: Phaser.Math.Linear(friendX + 24, bridgeTarget.x, index / 4),
        y: Phaser.Math.Linear(friendY - 12, bridgeTarget.y - 12, index / 4) + Phaser.Math.Between(-12, 12),
        alpha: 0,
        scale: 0.82,
        delay: 220 + index * 110,
        duration: 560,
        ease: "Cubic.easeOut",
        onComplete: () => twinkle.destroy(),
      });
    }
  }

  private playBridgeTargetGlow(x: number, y: number): void {
    const glow = this.add.ellipse(x, y + 2, 54, 38, COLORS.yellow, 0.26);
    glow.setDepth(13);

    this.tweens.add({
      targets: glow,
      scaleX: 1.28,
      scaleY: 1.2,
      alpha: 0,
      duration: 680,
      ease: "Cubic.easeOut",
      onComplete: () => glow.destroy(),
    });
  }

  private renderMathStory(question: MathQuestion): void {
    this.storyContainer?.removeAll(true);
    this.drawStoryPanel();

    if (question.operator === "+") {
      this.drawTokenGroup(-54, -12, question.left, COLORS.yellow);
      this.addStorySymbol(2, -12, "+");
      this.drawTokenGroup(62, -12, question.right, COLORS.green);
      this.drawCountBadge(-54, 42, question.left, COLORS.yellow);
      this.drawCountBadge(62, 42, question.right, COLORS.green);
      return;
    }

    this.drawTokenGroup(-54, -12, question.left, COLORS.yellow);
    this.addStorySymbol(2, -12, "-");
    this.drawTokenGroup(62, -12, question.right, COLORS.coral, 0.56);
    this.drawCountBadge(-54, 42, question.left, COLORS.yellow);
    this.drawCountBadge(62, 42, question.right, COLORS.coral);
  }

  private drawStoryPanel(): void {
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.white, 0.18);
    panel.fillEllipse(-54, -8, 118, 78);
    panel.fillEllipse(62, -8, 118, 78);
    panel.fillStyle(0xfff3bf, 0.14);
    panel.fillEllipse(-54, -8, 88, 58);
    panel.fillStyle(0xd7ffe2, 0.13);
    panel.fillEllipse(62, -8, 88, 58);
    panel.lineStyle(2, COLORS.white, 0.28);
    panel.strokeEllipse(-54, -8, 108, 68);
    panel.strokeEllipse(62, -8, 108, 68);
    panel.fillStyle(COLORS.white, 0.16);
    panel.fillCircle(0, -10, 28);
    this.storyContainer?.add(panel);
  }

  private drawTokenGroup(x: number, y: number, count: number, color: number, alpha = 1): void {
    const visualCount = Math.min(count, 10);
    const columns = visualCount > 6 ? 5 : Math.min(5, Math.max(1, visualCount));
    const spacing = visualCount > 6 ? 13 : 15;
    const startX = x - ((columns - 1) * spacing) / 2;

    for (let index = 0; index < visualCount; index += 1) {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const token = this.add.star(startX + column * spacing, y - 10 + row * 16, 5, 3, 8, color, alpha);
      token.setStrokeStyle(1.6, COLORS.ink, 0.42 * alpha);
      this.storyContainer?.add(token);
    }
  }

  private drawCountBadge(x: number, y: number, count: number, color: number): void {
    const badge = this.add.graphics();
    badge.fillStyle(COLORS.white, 0.68);
    badge.fillRoundedRect(x - 21, y - 11, 42, 22, 11);
    badge.lineStyle(2, color, 0.58);
    badge.strokeRoundedRect(x - 18, y - 8, 36, 16, 8);

    const label = this.add
      .text(x, y - 1, String(count), {
        color: "#203147",
        fontFamily: UI_FONT,
        fontSize: "15px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.storyContainer?.add([badge, label]);
  }

  private addStorySymbol(x: number, y: number, symbol: string): void {
    const text = this.add
      .text(x, y, symbol, {
        color: "#4b6378",
        fontFamily: UI_FONT,
        fontSize: "26px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.storyContainer?.add(text);
  }

  private drawNumberPlanks(question: MathQuestion): void {
    const spots = [
      { x: 224, y: 328, angle: -9, startX: -92, startY: 358 },
      { x: 422, y: 352, angle: 1, startX: 422, startY: 444 },
      { x: 634, y: 326, angle: 8, startX: GAME_WIDTH + 96, startY: 356 },
    ];

    this.planks = question.choices.map((choice, index) => {
      const spot = spots[index];
      const plank = new NumberPlank(this, spot.x, spot.y, choice, (answer, selectedPlank) =>
        this.handleAnswer(answer, selectedPlank),
      spot.angle);
      plank.setDepth(7);
      plank.driftInFrom(spot.startX, spot.startY, index * 230, () => {
        this.playRiverWake(spot.x, spot.y);
      });
      return plank;
    });
  }

  private playRiverWake(x: number, y: number): void {
    const wake = this.add.ellipse(x, y + 16, 118, 20);
    wake.setDepth(6);
    wake.setStrokeStyle(3, COLORS.white, 0.28);
    wake.setFillStyle(COLORS.white, 0);

    this.tweens.add({
      targets: wake,
      scaleX: 1.52,
      scaleY: 1.82,
      alpha: 0,
      duration: 740,
      ease: "Cubic.easeOut",
      onComplete: () => wake.destroy(),
    });

    for (let index = 0; index < 3; index += 1) {
      const glint = this.add.star(x + Phaser.Math.Between(-36, 36), y + Phaser.Math.Between(-8, 18), 5, 2, 5, COLORS.white, 0.52);
      glint.setDepth(8);
      glint.setScale(0.18);
      this.tweens.add({
        targets: glint,
        y: glint.y - Phaser.Math.Between(8, 18),
        scale: 0.48,
        alpha: 0,
        delay: index * 90,
        duration: 620,
        ease: "Sine.easeOut",
        onComplete: () => glint.destroy(),
      });
    }
  }

  private playChoiceCue(): void {
    this.clearChoiceCue();
    this.choiceCue = this.add.container(0, 0);
    this.choiceCue.setDepth(10);

    this.planks.forEach((plank, index) => {
      const sparkle = this.add.star(plank.x + 24, plank.y - 24, 5, 2, 6, COLORS.white, 0.5);
      const ripple = this.add.ellipse(plank.x, plank.y + 10, 104, 24);
      ripple.setStrokeStyle(2, COLORS.white, 0.13);
      ripple.setFillStyle(COLORS.white, 0);
      this.choiceCue?.add([ripple, sparkle]);

      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - 8,
        angle: 16,
        alpha: 0.12,
        delay: index * 120,
        duration: 980,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: ripple,
        scaleX: 1.06,
        scaleY: 1.14,
        alpha: 0.035,
        delay: index * 80,
        duration: 1180,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  private clearChoiceCue(): void {
    this.choiceCue?.destroy(true);
    this.choiceCue = undefined;
  }

  private handleAnswer(answer: number, plank: NumberPlank): void {
    const question = this.questions[this.currentQuestionIndex];

    if (this.isResolvingAnswer || !question || !this.banner || !this.progressBar || !this.rewardSystem || !this.bridge) {
      return;
    }

    if (answer === question.answer) {
      this.handleCorrectAnswer(plank);
      return;
    }

    this.handleWrongAnswer(plank);
  }

  private handleCorrectAnswer(plank: NumberPlank): void {
    if (!this.banner || !this.progressBar || !this.rewardSystem || !this.bridge) {
      return;
    }

    this.isResolvingAnswer = true;
    const completedAfterAnswer = this.questionsAnswered + 1;
    this.score += GAME_RULES.pointsPerCorrectAnswer;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.correctAnswers += 1;
    this.questionsAnswered += 1;

    this.updateScoreHud();
    this.clearChoiceCue();
    this.fadeUnusedPlanks(plank);
    this.progressBar.setProgress(this.questionsAnswered / GAME_RULES.questionsPerRound);
    this.updateStoryDots();
    this.tweens.add({
      targets: [this.storyContainer, this.equationText, this.equationPlate],
      alpha: 0.14,
      duration: 260,
      ease: "Sine.easeOut",
    });
    this.helperText?.setAlpha(0);
    this.helperPlate?.setAlpha(0);
    this.showFriendBubble(this.getCorrectBubble(), COLORS.yellow, 1320);
    this.cameras.main.shake(80, 0.0015);
    this.bridge.celebrateStep();

    if (this.combo >= 3) {
      this.banner.show("Super Bridge!", COLORS.green, true);
      this.bridge.celebrateCombo();
      this.playComboSceneBeat();
      this.showFriendBubble("Wow!", COLORS.green, 840);
      this.banner.hideSoon(1180);
    }

    const target = this.bridge.getNextPlankTarget();
    this.playPlankTrail(plank.x, plank.y, target.x, target.y);
    plank.flyToBridge(target.x, target.y, target.angle, () => {
      this.bridge?.setProgress(completedAfterAnswer);
      this.playBridgeLanding(target.x, target.y, target.angle);
      this.rescueFriend?.hopTo(completedAfterAnswer);
      if (this.combo >= 3) {
        this.rewardSystem?.playCombo(centerX, 132);
        this.rescueFriend?.comboDance();
      } else {
        this.rewardSystem?.playCorrect(target.x, target.y);
      }
      plank.destroy();
      this.planks = [];
    });

    this.time.delayedCall(3180, () => {
      if (this.questionsAnswered >= GAME_RULES.questionsPerRound) {
        this.playCloudWipe(() => {
          this.scene.start("ResultScene", {
            correctAnswers: this.correctAnswers,
            totalQuestions: GAME_RULES.questionsPerRound,
            score: this.score,
            bestCombo: this.bestCombo,
          });
        });
        return;
      }

      this.playCloudWipe(() => {
        this.currentQuestionIndex += 1;
        this.showCurrentQuestion();
      });
    });
  }

  private handleWrongAnswer(plank: NumberPlank): void {
    if (!this.helperText) {
      return;
    }

    this.combo = 0;
    this.isResolvingAnswer = true;
    this.updateScoreHud();
    this.clearChoiceCue();
    plank.nudgeBack();
    this.helperText.setText(Phaser.Math.RND.pick(["Almost there", "Try one more", "So close"]));
    this.helperText.setAlpha(0.95);
    this.helperPlate?.setAlpha(0.92);
    this.showFriendBubble("Almost!", COLORS.white, 980);
    this.rescueFriend?.encourage();

    this.time.delayedCall(1500, () => {
      this.isResolvingAnswer = false;
      this.helperText?.setText(this.getHelperPrompt());
      this.tweens.add({
        targets: [this.helperText, this.helperPlate],
        alpha: 0.1,
        duration: 300,
        ease: "Sine.easeInOut",
      });
      this.playChoiceCue();
    });
  }

  private fadeUnusedPlanks(selectedPlank: NumberPlank): void {
    const remainingPlanks: NumberPlank[] = [];

    this.planks.forEach((numberPlank, index) => {
      if (numberPlank === selectedPlank) {
        numberPlank.disableChoice(false);
        remainingPlanks.push(numberPlank);
        return;
      }

      numberPlank.disableChoice(false);
      this.tweens.add({
        targets: numberPlank,
        alpha: 0,
        y: numberPlank.y + 18,
        scale: 0.72,
        delay: index * 40,
        duration: 360,
        ease: "Sine.easeIn",
        onComplete: () => numberPlank.destroy(),
      });
    });

    this.planks = remainingPlanks;
  }

  private playPlankTrail(startX: number, startY: number, targetX: number, targetY: number): void {
    for (let index = 0; index < 10; index += 1) {
      const t = index / 9;
      const sparkle = this.add.star(
        Phaser.Math.Linear(startX, targetX, t),
        Phaser.Math.Linear(startY, targetY, t) - Math.sin(t * Math.PI) * 72,
        5,
        3,
        8,
        index % 2 === 0 ? COLORS.yellow : COLORS.white,
        0.92,
      );
      sparkle.setDepth(23);
      sparkle.setScale(0.2);

      this.tweens.add({
        targets: sparkle,
        scale: 1,
        alpha: 0,
        angle: 140,
        delay: index * 42,
        duration: 680,
        ease: "Cubic.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private playBridgeLanding(x: number, y: number, angle = 0): void {
    const bridgeFlash = this.add.container(x, y);
    const flashArt = this.add.graphics();
    bridgeFlash.setDepth(22);
    bridgeFlash.setAngle(angle);
    flashArt.fillStyle(COLORS.white, 0.34);
    flashArt.fillRoundedRect(-72, -14, 144, 28, 14);
    flashArt.fillStyle(COLORS.yellow, 0.46);
    flashArt.fillRoundedRect(-58, -8, 116, 16, 8);
    flashArt.lineStyle(4, COLORS.white, 0.62);
    flashArt.lineBetween(-48, -2, 48, -2);
    bridgeFlash.add(flashArt);
    bridgeFlash.setScale(0.62);
    bridgeFlash.setAlpha(0);

    this.tweens.add({
      targets: bridgeFlash,
      alpha: 1,
      scaleX: 1,
      scaleY: 0.9,
      duration: 260,
      ease: "Sine.easeOut",
      yoyo: true,
      hold: 520,
      onComplete: () => bridgeFlash.destroy(true),
    });

    const glow = this.add.ellipse(x, y + 4, 72, 42, COLORS.yellow, 0.34);
    const ring = this.add.ellipse(x, y + 4, 60, 34);
    const pop = this.add.star(x, y - 22, 5, 4, 10, COLORS.white, 0.92);
    glow.setDepth(18);
    ring.setDepth(19);
    pop.setDepth(20);
    ring.setStrokeStyle(4, COLORS.white, 0.72);
    ring.setFillStyle(COLORS.white, 0);
    pop.setScale(0.34);

    this.tweens.add({
      targets: glow,
      scaleX: 1.64,
      scaleY: 1.22,
      alpha: 0,
      duration: 760,
      ease: "Cubic.easeOut",
      onComplete: () => glow.destroy(),
    });
    this.tweens.add({
      targets: ring,
      scaleX: 1.72,
      scaleY: 1.34,
      alpha: 0,
      duration: 680,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: pop,
      y: y - 42,
      scale: 1.1,
      alpha: 0,
      angle: 80,
      duration: 720,
      ease: "Back.easeOut",
      onComplete: () => pop.destroy(),
    });

    for (let index = 0; index < 7; index += 1) {
      const shine = this.add.star(
        x + Phaser.Math.Between(-52, 52),
        y + Phaser.Math.Between(-18, 18),
        5,
        2,
        7,
        index % 2 === 0 ? COLORS.yellow : COLORS.white,
        0.78,
      );
      shine.setDepth(21);
      shine.setScale(0.24);

      this.tweens.add({
        targets: shine,
        y: shine.y - Phaser.Math.Between(14, 36),
        scale: 0.86,
        alpha: 0,
        angle: Phaser.Math.Between(-120, 120),
        delay: index * 52,
        duration: 840,
        ease: "Cubic.easeOut",
        onComplete: () => shine.destroy(),
      });
    }
  }

  private playCloudWipe(onCovered?: () => void): void {
    this.helperText?.setAlpha(0);
    this.helperPlate?.setAlpha(0);
    this.storyBubble?.hideNow();

    const cloud = this.add.container(-520, 140);
    cloud.setDepth(40);
    const art = this.add.graphics();
    art.fillStyle(COLORS.white, 0.82);
    art.fillCircle(10, 26, 92);
    art.fillCircle(94, -8, 122);
    art.fillCircle(212, 14, 102);
    art.fillCircle(316, 34, 82);
    art.fillRoundedRect(-72, 6, 560, 150, 72);
    art.fillStyle(COLORS.white, 0.44);
    art.fillCircle(82, 104, 38);
    art.fillCircle(250, 108, 46);
    cloud.add(art);

    this.time.delayedCall(420, () => onCovered?.());
    this.tweens.add({
      targets: cloud,
      x: GAME_WIDTH + 520,
      duration: 940,
      ease: "Sine.easeInOut",
      onComplete: () => cloud.destroy(true),
    });
  }

  private playComboSceneBeat(): void {
    const rainbow = this.add.graphics();
    rainbow.setDepth(21);
    const colors = [COLORS.coral, COLORS.yellow, COLORS.green, COLORS.blue, COLORS.purple];
    colors.forEach((color, index) => {
      rainbow.lineStyle(7, color, 0.66);
      rainbow.beginPath();
      rainbow.arc(centerX, 196, 184 + index * 12, Math.PI + 0.18, Math.PI * 2 - 0.18);
      rainbow.strokePath();
    });
    rainbow.setAlpha(0);

    this.tweens.add({
      targets: rainbow,
      alpha: 1,
      duration: 220,
      yoyo: true,
      hold: 460,
      ease: "Sine.easeOut",
      onComplete: () => rainbow.destroy(),
    });

    for (let index = 0; index < 18; index += 1) {
      const star = this.add.star(
        Phaser.Math.Between(28, GAME_WIDTH - 28),
        Phaser.Math.Between(42, 166),
        5,
        4,
        11,
        index % 3 === 0 ? COLORS.yellow : COLORS.white,
        0.9,
      );
      star.setDepth(22);
      star.setScale(0.3);

      this.tweens.add({
        targets: star,
        y: star.y + Phaser.Math.Between(76, 172),
        x: star.x + Phaser.Math.Between(-20, 20),
        scale: 1,
        angle: Phaser.Math.Between(-120, 120),
        alpha: 0,
        delay: index * 34,
        duration: 1120,
        ease: "Cubic.easeOut",
        onComplete: () => star.destroy(),
      });
    }
  }

  private updateScoreHud(): void {
    this.scoreText?.setText(`Score ${this.score}`);
    this.comboText?.setText(`Streak ${this.combo}`);
  }

  private clearPlanks(): void {
    this.clearChoiceCue();
    this.planks.forEach((plank) => plank.destroy());
    this.planks = [];
  }
}
