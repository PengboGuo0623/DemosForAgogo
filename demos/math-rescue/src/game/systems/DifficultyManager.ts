import type { DifficultyBand, DifficultyRule } from "../data/gameConfig";

export class DifficultyManager {
  getCurrentBand(questionIndex: number): DifficultyBand {
    if (questionIndex < 3) {
      return "intro";
    }

    if (questionIndex < 6) {
      return "easy";
    }

    return "stretch";
  }

  getRule(questionIndex: number): DifficultyRule {
    const difficulty = this.getCurrentBand(questionIndex);

    if (difficulty === "intro") {
      return {
        difficulty,
        allowedOperators: ["+"],
        maxAnswer: 10,
        maxOperand: 9,
      };
    }

    if (difficulty === "easy") {
      return {
        difficulty,
        allowedOperators: ["+", "-"],
        maxAnswer: 10,
        maxOperand: 10,
      };
    }

    return {
      difficulty,
      allowedOperators: ["+", "-"],
      maxAnswer: 20,
      maxOperand: 20,
    };
  }
}
