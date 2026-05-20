import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_HEIGHT, GAME_WIDTH } from "../data/gameConfig";
import { addStageBackdrop } from "../utils/art";
import { centerX } from "../utils/layout";

interface MenuIntroParts {
  friend: Phaser.GameObjects.Container;
  bridge: Phaser.GameObjects.Graphics;
  thought: Phaser.GameObjects.Container;
  title: Phaser.GameObjects.Text;
  subtitle: Phaser.GameObjects.Text;
  startButton: Phaser.GameObjects.Container;
  startHitZone: Phaser.GameObjects.Zone;
}

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.drawBackground();
    const rescueParts = this.drawRescueFriend();
    const title = this.add
      .text(centerX, 102, "Math Rescue", {
        color: "#203147",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "40px",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(centerX, 146, "Help the star friends!", {
        color: "#37516b",
        fontFamily: "Arial, sans-serif",
        fontSize: "19px",
        align: "center",
      })
      .setOrigin(0.5);

    const startParts = this.createStartButton();
    this.playOpeningIntro({
      ...rescueParts,
      title,
      subtitle,
      ...startParts,
    });
  }

  private drawBackground(): void {
    addStageBackdrop(this, { y: 330, coverPadding: 300, overlayAlpha: 0.1 });
    const graphics = this.add.graphics();
    graphics.setDepth(-6);
    graphics.fillStyle(COLORS.white, 0.14);
    graphics.fillEllipse(centerX, 326, 520, 360);
    graphics.fillStyle(0x5fd5e8, 0.12);
    graphics.fillRoundedRect(-10, 430, GAME_WIDTH + 20, 316, 72);
    graphics.fillStyle(COLORS.white, 0.18);
    graphics.fillRoundedRect(78, 378, 236, 42, 20);
    graphics.lineStyle(3, COLORS.white, 0.42);
    graphics.lineBetween(92, 390, 298, 390);
    graphics.lineBetween(92, 406, 298, 406);
  }

  private drawRescueFriend(): Pick<MenuIntroParts, "friend" | "bridge" | "thought"> {
    const friend = this.add.container(-82, 342);
    const shadow = this.add.ellipse(0, 58, 70, 16, COLORS.shadow, 0.16);
    const body = this.add.image(0, -4, ART_KEYS.starFriendBody).setDisplaySize(152, 144);
    friend.add([shadow, body]);
    friend.setAlpha(0);
    friend.setScale(0.84);
    friend.setAngle(-12);
    friend.setDepth(12);

    const bridge = this.add.graphics();
    bridge.fillStyle(COLORS.cream, 1);
    bridge.lineStyle(3, COLORS.yellow, 0.9);
    for (let index = 0; index < 4; index += 1) {
      const x = centerX - 12 + index * 34;
      bridge.fillRoundedRect(x - 14, 346, 28, 54, 10);
      bridge.strokeRoundedRect(x - 14, 346, 28, 54, 10);
    }
    bridge.setAlpha(0);
    bridge.setDepth(8);

    const thought = this.add.container(centerX + 82, 294);
    const thoughtArt = this.add.graphics();
    thoughtArt.fillStyle(COLORS.white, 0.76);
    thoughtArt.fillCircle(-44, -14, 32);
    thoughtArt.fillCircle(-8, -14, 40);
    thoughtArt.fillCircle(28, -8, 30);
    thoughtArt.fillRoundedRect(-48, -4, 112, 42, 20);
    thoughtArt.fillCircle(-74, 20, 7);
    thoughtArt.fillCircle(-86, 34, 4);
    thought.add(thoughtArt);
    for (let index = 0; index < 5; index += 1) {
      thought.add(
        this.add.star(-32 + index * 18, (index % 2) * 12, 5, 4, 9, index < 2 ? COLORS.yellow : COLORS.green),
      );
    }
    thought.setAlpha(0);
    thought.setScale(0.62);
    thought.setDepth(14);

    return { friend, bridge, thought };
  }

  private createStartButton(): Pick<MenuIntroParts, "startButton" | "startHitZone"> {
    const button = this.add.container(centerX, 778);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.shadow, 0.1);
    bg.fillEllipse(8, 12, 238, 82);
    bg.fillStyle(COLORS.cream, 1);
    bg.lineStyle(5, COLORS.yellow, 0.9);
    bg.fillEllipse(0, 0, 238, 82);
    bg.strokeEllipse(0, 0, 238, 82);
    bg.lineStyle(3, COLORS.white, 0.44);
    bg.lineBetween(-78, -14, 78, -14);
    bg.lineStyle(2, COLORS.shadow, 0.12);
    bg.lineBetween(-82, 18, 82, 18);

    const label = this.add
      .text(0, 0, "Start", {
        color: "#203147",
        fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        fontSize: "30px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(250, 98);
    button.setAlpha(0);
    button.setScale(0.82);
    button.setDepth(16);
    const hitZone = this.add.zone(centerX, 684, 286, 126);
    hitZone.disableInteractive();
    hitZone.setDepth(17);
    hitZone.on("pointerdown", () => {
      hitZone.disableInteractive();
      this.tweens.killTweensOf(button);
      this.tweens.add({
        targets: button,
        scale: 0.94,
        duration: 80,
        yoyo: true,
        onComplete: () => this.scene.start("PlayScene"),
      });
    });

    return { startButton: button, startHitZone: hitZone };
  }

  private playOpeningIntro(parts: MenuIntroParts): void {
    const { friend, bridge, thought, title, subtitle, startButton, startHitZone } = parts;

    title.setAlpha(0);
    title.setScale(0.94);
    title.setDepth(20);
    subtitle.setAlpha(0);
    subtitle.setDepth(20);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      y: 106,
      duration: 420,
      delay: 120,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      y: 154,
      duration: 320,
      delay: 320,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: bridge,
      alpha: 1,
      delay: 420,
      duration: 360,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: friend,
      x: centerX - 84,
      alpha: 1,
      scale: 1,
      angle: 0,
      delay: 540,
      duration: 620,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: friend,
          y: 334,
          angle: -3,
          duration: 980,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });

    this.tweens.add({
      targets: thought,
      alpha: 1,
      scale: 1,
      delay: 980,
      duration: 300,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: startButton,
      y: 684,
      alpha: 1,
      scale: 1,
      delay: 1260,
      duration: 520,
      ease: "Back.easeOut",
      onComplete: () => {
        startHitZone.setInteractive({ useHandCursor: true });
        this.tweens.add({
          targets: startButton,
          y: 674,
          angle: -2,
          duration: 980,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });
  }
}
