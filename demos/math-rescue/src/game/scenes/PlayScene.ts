import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_HEIGHT, GAME_WIDTH, GAME_RULES, type MathQuestion } from "../data/gameConfig";
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
    this.banner = new ComboBanner(this, centerX, 326);
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
    graphics.fillEllipse(centerX, 354, 438, 180);
    graphics.fillStyle(0x62dff0, 0.06);
    graphics.fillRoundedRect(-8, 536, GAME_WIDTH + 16, 250, 66);

    for (let index = 0; index < 14; index += 1) {
      const x = Phaser.Math.Between(26, GAME_WIDTH - 26);
      const y = Phaser.Math.Between(78, 708);
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
    this.bridge = new RescueBridge(this, centerX, 390);
    this.bridge.setDepth(12);
    this.rescueFriend = new RescueFriend(this, centerX, 330);
    this.rescueFriend.setDepth(16);
  }

  private drawHud(): void {
    this.scoreText = this.add
      .text(34, 42, "Score 0", {
        color: "#203147",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)
      .setAlpha(0);

    this.comboText = this.add
      .text(GAME_WIDTH - 34, 42, "Streak 0", {
        color: "#203147",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5)
      .setAlpha(0);

    this.progressBar = new ProgressBar(this, centerX, 36);
    this.progressBar.setProgress(0);
    this.progressBar.setAlpha(0);
    this.createStoryDots();
  }

  private createMathStoryArea(): void {
    this.questionCounterText = this.add
      .text(centerX, 42, "Scene 1/8", {
        color: "#4b6378",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.storyContainer = this.add.container(centerX, 518);
    this.storyContainer.setDepth(14);
    this.equationText = this.add
      .text(centerX, 592, "", {
        color: "#4b6378",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(15);

    this.helperPlate = this.add.graphics();
    this.helperPlate.setDepth(29);
    this.drawHelperPlate();
    this.helperText = this.add
      .text(centerX, 632, "Pick a bridge plank", {
        color: "#4b6378",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
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

  private drawHelperPlate(): void {
    if (!this.helperPlate) {
      return;
    }

    this.helperPlate.clear();
    const x = centerX;
    const y = 628;
    this.helperPlate.fillStyle(COLORS.shadow, 0.08);
    this.helperPlate.fillRoundedRect(x - 92, y - 16, 184, 40, 20);
    this.helperPlate.fillStyle(COLORS.white, 0.7);
    this.helperPlate.fillCircle(x - 66, y - 4, 20);
    this.helperPlate.fillCircle(x - 36, y - 14, 22);
    this.helperPlate.fillCircle(x + 4, y - 16, 24);
    this.helperPlate.fillCircle(x + 44, y - 10, 20);
    this.helperPlate.fillCircle(x + 70, y, 17);
    this.helperPlate.fillRoundedRect(x - 88, y - 14, 176, 38, 19);
    this.helperPlate.lineStyle(2, COLORS.white, 0.64);
    this.helperPlate.strokeRoundedRect(x - 78, y - 9, 156, 28, 14);
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
    this.waterForeground.fillEllipse(82, 616, 128, 18);
    this.waterForeground.fillEllipse(306, 704, 126, 18);
    this.waterForeground.fillEllipse(178, 806, 138, 16);
    this.waterForeground.lineStyle(3, COLORS.white, 0.1);
    this.waterForeground.lineBetween(28, 622, 150, 622);
    this.waterForeground.lineBetween(238, 710, 376, 710);
    this.waterForeground.lineBetween(88, 812, 270, 812);
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
    const startX = centerX - 74;
    this.progressDots = [];

    for (let index = 0; index < GAME_RULES.questionsPerRound; index += 1) {
      const dot = this.add.circle(startX + index * 21, 38, 4.5, COLORS.white, 0.66);
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
    if (!this.storyContainer || !this.equationText) {
      return;
    }

    this.storyContainer.setAlpha(0);
    this.storyContainer.setScale(0.82);
    this.storyContainer.y = 536;
    this.equationText.setAlpha(0);
    this.tweens.add({
      targets: this.storyContainer,
      alpha: 1,
      scale: 1,
      y: 518,
      duration: 620,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: this.equationText,
      alpha: 1,
      delay: 420,
      duration: 360,
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

    this.time.delayedCall(2380, () => {
      this.isResolvingAnswer = false;
      this.helperText?.setText(this.getHelperPrompt());
      this.tweens.add({
        targets: [this.helperText, this.helperPlate],
        alpha: 0.84,
        duration: 220,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.helperText?.setAlpha(0.84);
          this.helperPlate?.setAlpha(0.84);
          this.time.delayedCall(680, () => {
            if (!this.isResolvingAnswer) {
              this.tweens.add({
                targets: [this.helperText, this.helperPlate],
                alpha: 0.18,
                duration: 360,
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
    this.storyBubble?.show(message, centerX, 300, tint);
    this.storyBubble?.hide(hideDelay);
  }

  private getIntroBubble(): string {
    return [
      "A gap!",
      "Find light!",
      "Send light!",
      "Bridge up!",
      "More bridge!",
      "Careful!",
      "Almost!",
      "Last step!",
    ][this.currentQuestionIndex] ?? "Go!";
  }

  private getHelperPrompt(): string {
    if (this.currentQuestionIndex < 2) {
      return "Pick star light";
    }

    if (this.currentQuestionIndex < 5) {
      return "Grow the bridge";
    }

    if (this.currentQuestionIndex < 7) {
      return "Guide the star";
    }

    return "One more glow";
  }

  private getCorrectBubble(): string {
    if (this.currentQuestionIndex < 2) {
      return "Spark!";
    }

    if (this.currentQuestionIndex < 5) {
      return "Build!";
    }

    if (this.currentQuestionIndex < 7) {
      return "Step!";
    }

    return "Made it!";
  }

  private playGuideSpark(): void {
    const friendX = this.rescueFriend?.x ?? centerX - 138;
    const bridgeTarget = this.bridge?.getNextPlankTarget() ?? { x: centerX, y: 248 };
    const spark = this.add.star(friendX + 24, 344, 5, 5, 12, COLORS.yellow, 0.95);
    spark.setDepth(22);
    spark.setScale(0.45);

    this.tweens.add({
      targets: spark,
      x: bridgeTarget.x,
      y: bridgeTarget.y - 22,
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
      const twinkle = this.add.star(friendX + 22, 344, 5, 2, 6, COLORS.white, 0.72);
      twinkle.setDepth(22);
      twinkle.setScale(0.2);

      this.tweens.add({
        targets: twinkle,
        x: Phaser.Math.Linear(friendX + 24, bridgeTarget.x, index / 4),
        y: Phaser.Math.Linear(344, bridgeTarget.y - 22, index / 4) + Phaser.Math.Between(-18, 18),
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
    this.drawStoryCloud(-76, -3, question.left > 9 ? 110 : 92);
    this.drawStoryCloud(84, -3, question.right > 9 ? 104 : 86);
    this.drawSignPost();

    if (question.operator === "+") {
      this.drawTokenGroup(-76, -3, question.left, COLORS.yellow);
      this.addStorySymbol(0, -2, "+");
      this.drawTokenGroup(84, -3, question.right, COLORS.green);
      return;
    }

    this.drawTokenGroup(-76, -3, question.left, COLORS.yellow);
    this.addStorySymbol(44, -2, "-");
    this.drawTokenGroup(84, -3, question.right, COLORS.coral, 0.58);
  }

  private drawStoryCloud(x: number, y: number, width: number): void {
    const cloud = this.add.graphics();
    cloud.fillStyle(COLORS.white, 0.76);
    cloud.fillCircle(x - width * 0.34, y + 38, 8);
    cloud.fillCircle(x - width * 0.43, y + 54, 5);
    cloud.fillCircle(x - width * 0.23, y + 6, 28);
    cloud.fillCircle(x, y - 2, 34);
    cloud.fillCircle(x + width * 0.24, y + 8, 26);
    cloud.fillRoundedRect(x - width / 2, y + 2, width, 42, 22);
    cloud.lineStyle(3, COLORS.white, 0.52);
    cloud.strokeRoundedRect(x - width / 2 + 6, y + 6, width - 12, 34, 17);
    this.storyContainer?.add(cloud);
  }

  private drawSignPost(): void {
    const sign = this.add.graphics();
    sign.fillStyle(COLORS.shadow, 0.2);
    sign.fillRoundedRect(-39, 56, 82, 34, 14);
    sign.fillStyle(COLORS.cream, 1);
    sign.lineStyle(2, COLORS.yellow, 0.78);
    sign.fillRoundedRect(-43, 50, 86, 34, 14);
    sign.strokeRoundedRect(-43, 50, 86, 34, 14);
    this.storyContainer?.add(sign);
  }

  private drawTokenGroup(x: number, y: number, count: number, color: number, alpha = 1): void {
    const columns = count > 10 ? 5 : Math.min(5, Math.max(1, count));
    const spacing = count > 10 ? 14 : 17;
    const startX = x - ((columns - 1) * spacing) / 2;

    for (let index = 0; index < count; index += 1) {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const token = this.add.star(startX + column * spacing, y - 12 + row * 20, 5, 5, 10, color, alpha);
      token.setStrokeStyle(2, COLORS.ink, 0.72 * alpha);
      this.storyContainer?.add(token);
    }
  }

  private addStorySymbol(x: number, y: number, symbol: string): void {
    const text = this.add
      .text(x, y, symbol, {
        color: "#203147",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "32px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.storyContainer?.add(text);
  }

  private drawNumberPlanks(question: MathQuestion): void {
    const spots = [
      { x: 66, y: 678, angle: -10 },
      { x: 316, y: 728, angle: 8 },
      { x: 182, y: 790, angle: -4 },
    ];

    this.planks = question.choices.map((choice, index) => {
      const spot = spots[index];
      const plank = new NumberPlank(this, spot.x, spot.y, choice, (answer, selectedPlank) =>
        this.handleAnswer(answer, selectedPlank),
      spot.angle);
      plank.setDepth(7);
      const entersFromLeft = index !== 1;
      plank.driftInFrom(entersFromLeft ? -78 : GAME_WIDTH + 78, spot.y + 18, index * 190, () => {
        this.playRiverWake(spot.x, spot.y);
      });
      return plank;
    });
  }

  private playRiverWake(x: number, y: number): void {
    const wake = this.add.ellipse(x, y + 16, 128, 24);
    wake.setDepth(10);
    wake.setStrokeStyle(4, COLORS.white, 0.4);
    wake.setFillStyle(COLORS.white, 0);

    this.tweens.add({
      targets: wake,
      scaleX: 1.32,
      scaleY: 1.7,
      alpha: 0,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => wake.destroy(),
    });
  }

  private playChoiceCue(): void {
    this.clearChoiceCue();
    this.choiceCue = this.add.container(0, 0);
    this.choiceCue.setDepth(10);

    this.planks.forEach((plank, index) => {
      const sparkle = this.add.star(plank.x + 30, plank.y - 28, 5, 3, 7, COLORS.white, 0.62);
      const ripple = this.add.ellipse(plank.x, plank.y + 8, 118, 32);
      ripple.setStrokeStyle(3, COLORS.white, 0.2);
      ripple.setFillStyle(COLORS.white, 0);
      this.choiceCue?.add([ripple, sparkle]);

      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - 8,
        angle: 16,
        alpha: 0.16,
        delay: index * 120,
        duration: 780,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: ripple,
        scaleX: 1.06,
        scaleY: 1.14,
        alpha: 0.06,
        delay: index * 80,
        duration: 920,
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
      targets: [this.storyContainer, this.equationText],
      alpha: 0.3,
      duration: 260,
      ease: "Sine.easeOut",
    });
    this.helperText?.setAlpha(0);
    this.helperPlate?.setAlpha(0);
    this.showFriendBubble(this.getCorrectBubble(), COLORS.yellow, 720);
    this.cameras.main.shake(80, 0.0015);
    this.bridge.celebrateStep();

    if (this.combo >= 3) {
      this.banner.show("Super Rescue!", COLORS.green, true);
      this.bridge.celebrateCombo();
      this.playComboSceneBeat();
      this.showFriendBubble("Wow!", COLORS.green, 840);
      this.banner.hideSoon(960);
    }

    const target = this.bridge.getNextPlankTarget();
    this.playPlankTrail(plank.x, plank.y, target.x, target.y);
    plank.flyToBridge(target.x, target.y, target.angle, () => {
      this.bridge?.setProgress(completedAfterAnswer);
      this.playBridgeLanding(target.x, target.y);
      this.rescueFriend?.hopTo(completedAfterAnswer);
      if (this.combo >= 3) {
        this.rewardSystem?.playCombo(centerX, 250);
        this.rescueFriend?.comboDance();
      } else {
        this.rewardSystem?.playCorrect(target.x, target.y);
      }
      plank.destroy();
      this.planks = [];
    });

    this.time.delayedCall(2500, () => {
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
    this.updateScoreHud();
    this.clearChoiceCue();
    plank.nudgeBack();
    this.helperText.setText(Phaser.Math.RND.pick(["Almost", "Try another", "So close"]));
    this.helperText.setAlpha(0.95);
    this.helperPlate?.setAlpha(0.92);
    this.showFriendBubble("Try!", COLORS.white, 980);
    this.rescueFriend?.encourage();

    this.time.delayedCall(1500, () => {
      if (!this.isResolvingAnswer) {
        this.helperText?.setText(this.getHelperPrompt());
        this.tweens.add({
          targets: [this.helperText, this.helperPlate],
          alpha: 0.18,
          duration: 300,
          ease: "Sine.easeInOut",
        });
        this.playChoiceCue();
      }
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
    for (let index = 0; index < 6; index += 1) {
      const t = index / 5;
      const sparkle = this.add.star(
        Phaser.Math.Linear(startX, targetX, t),
        Phaser.Math.Linear(startY, targetY, t) - Math.sin(t * Math.PI) * 52,
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
        angle: 90,
        delay: index * 38,
        duration: 420,
        ease: "Cubic.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private playBridgeLanding(x: number, y: number): void {
    const glow = this.add.ellipse(x, y + 4, 58, 38, COLORS.yellow, 0.36);
    const ring = this.add.ellipse(x, y + 4, 52, 30);
    const pop = this.add.star(x, y - 22, 5, 4, 10, COLORS.white, 0.92);
    glow.setDepth(18);
    ring.setDepth(19);
    pop.setDepth(20);
    ring.setStrokeStyle(4, COLORS.white, 0.72);
    ring.setFillStyle(COLORS.white, 0);
    pop.setScale(0.34);

    this.tweens.add({
      targets: glow,
      scaleX: 1.46,
      scaleY: 1.18,
      alpha: 0,
      duration: 460,
      ease: "Cubic.easeOut",
      onComplete: () => glow.destroy(),
    });
    this.tweens.add({
      targets: ring,
      scaleX: 1.55,
      scaleY: 1.28,
      alpha: 0,
      duration: 420,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: pop,
      y: y - 42,
      scale: 1.1,
      alpha: 0,
      angle: 80,
      duration: 520,
      ease: "Back.easeOut",
      onComplete: () => pop.destroy(),
    });
  }

  private playCloudWipe(onCovered?: () => void): void {
    this.helperText?.setAlpha(0);
    this.helperPlate?.setAlpha(0);
    this.storyBubble?.hideNow();

    const cloud = this.add.container(-360, 318);
    cloud.setDepth(40);
    const art = this.add.graphics();
    art.fillStyle(COLORS.white, 0.82);
    art.fillCircle(10, 26, 92);
    art.fillCircle(94, -8, 122);
    art.fillCircle(212, 14, 102);
    art.fillCircle(316, 34, 82);
    art.fillRoundedRect(-72, 6, 470, 150, 72);
    art.fillStyle(COLORS.white, 0.44);
    art.fillCircle(82, 104, 38);
    art.fillCircle(250, 108, 46);
    cloud.add(art);

    this.time.delayedCall(420, () => onCovered?.());
    this.tweens.add({
      targets: cloud,
      x: GAME_WIDTH + 360,
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
      rainbow.arc(centerX, 270, 128 + index * 10, Math.PI + 0.1, Math.PI * 2 - 0.1);
      rainbow.strokePath();
    });
    rainbow.setAlpha(0);

    this.tweens.add({
      targets: rainbow,
      alpha: 1,
      duration: 120,
      yoyo: true,
      hold: 220,
      ease: "Sine.easeOut",
      onComplete: () => rainbow.destroy(),
    });

    for (let index = 0; index < 18; index += 1) {
      const star = this.add.star(
        Phaser.Math.Between(28, GAME_WIDTH - 28),
        Phaser.Math.Between(74, 170),
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
        y: star.y + Phaser.Math.Between(88, 190),
        x: star.x + Phaser.Math.Between(-20, 20),
        scale: 1,
        angle: Phaser.Math.Between(-120, 120),
        alpha: 0,
      delay: index * 28,
        duration: 920,
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
