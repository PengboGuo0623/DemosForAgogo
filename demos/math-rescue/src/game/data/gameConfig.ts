export const GAME_WIDTH = 844;
export const GAME_HEIGHT = 390;

export const GAME_RULES = {
  questionsPerRound: 8,
  answerChoices: 3,
  pointsPerCorrectAnswer: 10,
  targetSecondsMin: 60,
  targetSecondsMax: 90,
} as const;

export const COLORS = {
  sky: 0xa5e6f4,
  skyDeep: 0x63c8e8,
  cream: 0xfff2cf,
  white: 0xffffff,
  ink: 0x24384f,
  muted: 0x60788d,
  green: 0x62d88a,
  greenDark: 0x2d9b68,
  coral: 0xff8f86,
  yellow: 0xffd46f,
  purple: 0xa398f7,
  blue: 0x66aef7,
  shadow: 0x28455f,
} as const;

export const UI_FONT = "Nunito, Avenir Next Rounded, Arial Rounded MT Bold, Arial, sans-serif";

export const ART_KEYS = {
  backgroundStage: "art-background-stage",
  backgroundBridgeStage: "art-background-bridge-stage",
  bridgeCompletionPatch: "art-bridge-completion-patch",
  starFriendBody: "art-star-friend-body",
  bridgePlankEmpty: "art-bridge-plank-empty",
  bridgePlankFilled: "art-bridge-plank-filled",
  numberPlank: "art-number-plank",
  speechCloud: "art-speech-cloud",
} as const;

export const ART_PATHS = {
  backgroundStage: "assets/art/backgrounds/rescue-stage-landscape.png",
  backgroundBridgeStage: "assets/art/backgrounds/rescue-stage-landscape.png",
  bridgeCompletionPatch: "assets/art/generated/bridge-completion-patch-landscape.png",
  starFriendBody: "assets/art/generated/star-friend.png",
  bridgePlankEmpty: "assets/art/generated/bridge-plank.png",
  bridgePlankFilled: "assets/art/generated/bridge-plank.png",
  numberPlank: "assets/art/generated/answer-plank.png",
  speechCloud: "assets/art/generated/speech-cloud.png",
} as const;

export type MathOperator = "+" | "-";
export type DifficultyBand = "intro" | "easy" | "stretch";

export interface MathQuestion {
  prompt: string;
  left: number;
  operator: MathOperator;
  right: number;
  answer: number;
  choices: number[];
  difficulty: DifficultyBand;
}

export interface DifficultyRule {
  difficulty: DifficultyBand;
  allowedOperators: MathOperator[];
  maxAnswer: number;
  maxOperand: number;
}
