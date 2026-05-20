import Phaser from "phaser";
import { GAME_RULES, type DifficultyRule, type MathOperator, type MathQuestion } from "../data/gameConfig";
import { DifficultyManager } from "./DifficultyManager";

export class QuestionGenerator {
  private readonly difficultyManager = new DifficultyManager();

  createRound(): MathQuestion[] {
    return Array.from({ length: GAME_RULES.questionsPerRound }, (_, index) => this.createQuestion(index));
  }

  createQuestion(questionIndex: number): MathQuestion {
    const rule = this.difficultyManager.getRule(questionIndex);
    const operator = Phaser.Math.RND.pick(rule.allowedOperators);
    const operands = operator === "+" ? this.createAddition(rule) : this.createSubtraction(rule);
    const answer = operator === "+" ? operands.left + operands.right : operands.left - operands.right;

    return {
      prompt: `${operands.left} ${operator} ${operands.right} = ?`,
      left: operands.left,
      operator,
      right: operands.right,
      answer,
      choices: this.createChoices(answer, rule),
      difficulty: rule.difficulty,
    };
  }

  private createAddition(rule: DifficultyRule): { left: number; right: number } {
    const left = Phaser.Math.Between(1, Math.max(1, rule.maxAnswer - 1));
    const rightMax = Math.min(rule.maxOperand, rule.maxAnswer - left);
    const right = Phaser.Math.Between(1, Math.max(1, rightMax));

    return { left, right };
  }

  private createSubtraction(rule: DifficultyRule): { left: number; right: number } {
    const leftMin = rule.maxAnswer <= 10 ? 2 : 6;
    const left = Phaser.Math.Between(leftMin, rule.maxAnswer);
    const rightMax = Math.min(rule.maxOperand, left);
    const right = Phaser.Math.Between(1, Math.max(1, rightMax));

    return { left, right };
  }

  private createChoices(answer: number, rule: DifficultyRule): number[] {
    const choices = new Set<number>([answer]);
    const offsets = this.shuffle([-3, -2, -1, 1, 2, 3, 4, -4]);

    for (const offset of offsets) {
      const candidate = answer + offset;

      if (candidate >= 0 && candidate <= rule.maxAnswer) {
        choices.add(candidate);
      }

      if (choices.size === GAME_RULES.answerChoices) {
        break;
      }
    }

    let fallback = 0;
    while (choices.size < GAME_RULES.answerChoices) {
      if (fallback !== answer && fallback <= rule.maxAnswer) {
        choices.add(fallback);
      }
      fallback += 1;
    }

    return this.shuffle([...choices]);
  }

  private shuffle<T>(items: T[]): T[] {
    return Phaser.Utils.Array.Shuffle([...items]);
  }
}
