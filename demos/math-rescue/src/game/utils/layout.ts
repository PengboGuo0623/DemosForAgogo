import { GAME_HEIGHT, GAME_WIDTH } from "../data/gameConfig";

export const centerX = GAME_WIDTH / 2;
export const centerY = GAME_HEIGHT / 2;

export function stageX(percent: number): number {
  return GAME_WIDTH * percent;
}

export function stageY(percent: number): number {
  return GAME_HEIGHT * percent;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
