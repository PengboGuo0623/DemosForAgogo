export type GameStepId = "intro" | "sun" | "planting" | "watering" | "carrots" | "finale";

export interface StepConfig {
  id: GameStepId;
  prompt: string;
  required: number;
}

export const STEPS: StepConfig[] = [
  { id: "intro", prompt: "Tap Play", required: 1 },
  { id: "sun", prompt: "Tap the sun", required: 1 },
  { id: "planting", prompt: "Plant the flowers", required: 3 },
  { id: "watering", prompt: "Water the flowers", required: 1 },
  { id: "carrots", prompt: "Find the carrots", required: 3 },
  { id: "finale", prompt: "Garden party!", required: 1 }
];
