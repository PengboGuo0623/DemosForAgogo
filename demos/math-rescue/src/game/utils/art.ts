import Phaser from "phaser";
import { ART_KEYS, COLORS, GAME_HEIGHT, GAME_WIDTH } from "../data/gameConfig";
import { centerX } from "./layout";

interface BackdropOptions {
  key?: string;
  depth?: number;
  alpha?: number;
  y?: number;
  coverPadding?: number;
  overlayAlpha?: number;
}

export function addStageBackdrop(scene: Phaser.Scene, options: BackdropOptions = {}): Phaser.GameObjects.Image {
  const depth = options.depth ?? -20;
  const key = options.key ?? ART_KEYS.backgroundStage;
  const y = options.y ?? GAME_HEIGHT / 2;
  const coverPadding = options.coverPadding ?? 180;
  const background = scene.add.image(centerX, y, key);
  const source = scene.textures.get(key).getSourceImage() as { width: number; height: number };
  const scale = Math.max(GAME_WIDTH / source.width, (GAME_HEIGHT + coverPadding) / source.height);

  background.setScale(scale);
  background.setDepth(depth);
  background.setAlpha(options.alpha ?? 1);

  const overlayAlpha = options.overlayAlpha ?? 0.08;
  if (overlayAlpha > 0) {
    const overlay = scene.add.graphics();
    overlay.setDepth(depth + 1);
    overlay.fillGradientStyle(COLORS.white, COLORS.white, COLORS.sky, COLORS.sky, overlayAlpha, overlayAlpha, overlayAlpha * 0.6, overlayAlpha * 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  return background;
}
