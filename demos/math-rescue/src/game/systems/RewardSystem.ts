import Phaser from "phaser";
import { COLORS } from "../data/gameConfig";

export class RewardSystem {
  constructor(private readonly scene: Phaser.Scene) {}

  playCorrect(x: number, y: number): void {
    this.ring(x, y, COLORS.yellow, 88);
    this.burst(x, y, 16, 118, COLORS.yellow);
  }

  playCombo(x: number, y: number): void {
    this.ring(x, y, COLORS.green, 126);
    this.ring(x, y, COLORS.white, 164);
    this.burst(x, y, 26, 164, COLORS.green);
  }

  playResultBurst(x: number, y: number): void {
    this.ring(x, y, COLORS.yellow, 150);
    this.burst(x, y, 28, 176, COLORS.yellow);
  }

  private burst(x: number, y: number, count: number, radius: number, primaryColor: number): void {
    const particles: Phaser.GameObjects.Shape[] = [];

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const star = this.scene.add.star(
        x,
        y,
        5,
        7,
        16,
        index % 2 === 0 ? primaryColor : COLORS.white,
      );

      star.setDepth(28);
      star.setScale(0.72);
      particles.push(star);

      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * (radius * 0.78),
        alpha: 0,
        scale: 0.2,
        duration: 780,
        ease: "Cubic.easeOut",
        onComplete: () => star.destroy(),
      });
    }

    this.scene.tweens.add({
      targets: particles,
      angle: 180,
      duration: 780,
      ease: "Cubic.easeOut",
    });
  }

  private ring(x: number, y: number, color: number, radius: number): void {
    const ring = this.scene.add.circle(x, y, 18);
    ring.setDepth(27);
    ring.setStrokeStyle(5, color, 0.74);
    ring.setFillStyle(color, 0);

    this.scene.tweens.add({
      targets: ring,
      radius,
      alpha: 0,
      duration: 720,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }
}
