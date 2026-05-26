import Phaser from "phaser";
import { ART_KEYS, GAME_HEIGHT, GAME_RULES, GAME_WIDTH } from "../data/gameConfig";

export interface BridgeRepairTarget {
  sourceX: number;
  sourceY: number;
  angle: number;
  revealPadding: number;
}

export interface BridgeStageTransform {
  scale: number;
  left: number;
  top: number;
  sourceToCanvasX: (sourceX: number) => number;
  sourceToCanvasY: (sourceY: number) => number;
}

export interface BuddyPathSourcePoint {
  sourceX: number;
  sourceY: number;
  lean: number;
  deckAngle: number;
  scale: number;
  occlusionAlpha: number;
}

export const PATCH_SOURCE_RECT = {
  x: 210,
  y: 255,
  width: 1450,
  height: 345,
} as const;

export const BRIDGE_REPAIR_TARGETS: BridgeRepairTarget[] = [
  { sourceX: 585, sourceY: 548, angle: -7, revealPadding: 94 },
  { sourceX: 860, sourceY: 554, angle: -4, revealPadding: 112 },
  { sourceX: 1130, sourceY: 554, angle: -2, revealPadding: 116 },
  { sourceX: 1405, sourceY: 532, angle: 8, revealPadding: 120 },
  { sourceX: 1536, sourceY: 516, angle: 10, revealPadding: 124 },
];

const BUDDY_START_SOURCE = {
  sourceX: 314,
  sourceY: 472,
} as const;

const BUDDY_CENTER_ABOVE_DECK = 68;
const BUDDY_PATH_SCALES = [0.9, 0.88, 0.87, 0.88, 0.91, 0.95] as const;

export function getBridgeStageTransform(scene: Phaser.Scene): BridgeStageTransform {
  const backgroundSource = scene.textures.get(ART_KEYS.backgroundBridgeStage).getSourceImage() as {
    width: number;
    height: number;
  };
  const scale = Math.max(GAME_WIDTH / backgroundSource.width, GAME_HEIGHT / backgroundSource.height);
  const left = GAME_WIDTH / 2 - (backgroundSource.width * scale) / 2;
  const top = GAME_HEIGHT / 2 - (backgroundSource.height * scale) / 2;

  return {
    scale,
    left,
    top,
    sourceToCanvasX: (sourceX: number) => left + sourceX * scale,
    sourceToCanvasY: (sourceY: number) => top + sourceY * scale,
  };
}

export function getBridgeRepairTarget(step: number): BridgeRepairTarget {
  const index = Phaser.Math.Clamp(Math.round(step), 0, BRIDGE_REPAIR_TARGETS.length - 1);
  return BRIDGE_REPAIR_TARGETS[index] ?? BRIDGE_REPAIR_TARGETS[BRIDGE_REPAIR_TARGETS.length - 1];
}

export function getBuddyPathSourcePoint(completedSteps: number): BuddyPathSourcePoint {
  const step = Phaser.Math.Clamp(Math.round(completedSteps), 0, GAME_RULES.questionsPerRound);

  if (step <= 0) {
    return {
      ...BUDDY_START_SOURCE,
      lean: 0,
      deckAngle: -7,
      scale: BUDDY_PATH_SCALES[0],
      occlusionAlpha: 0,
    };
  }

  const target = getBridgeRepairTarget(step - 1);

  return {
    sourceX: target.sourceX,
    sourceY: target.sourceY - BUDDY_CENTER_ABOVE_DECK,
    lean: target.angle * 0.34,
    deckAngle: target.angle,
    scale: BUDDY_PATH_SCALES[step] ?? BUDDY_PATH_SCALES[BUDDY_PATH_SCALES.length - 1],
    occlusionAlpha: step >= GAME_RULES.questionsPerRound ? 0.44 : 0.66,
  };
}

export function getRevealRatioForSteps(completedSteps: number): number {
  if (completedSteps <= 0) {
    return 0;
  }

  const target = getBridgeRepairTarget(completedSteps - 1);
  const revealEdge = Phaser.Math.Clamp(
    target.sourceX + target.revealPadding,
    PATCH_SOURCE_RECT.x,
    PATCH_SOURCE_RECT.x + PATCH_SOURCE_RECT.width,
  );

  return Phaser.Math.Clamp((revealEdge - PATCH_SOURCE_RECT.x) / PATCH_SOURCE_RECT.width, 0, 1);
}
