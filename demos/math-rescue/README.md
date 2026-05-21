# Math Rescue

Math Rescue is a mobile-first H5/Web math education game demo for children ages
5-8.

This project is intentionally scoped as a browser demo:

- no App SDK integration
- no native bridge
- no real assets
- no backend
- no analytics

The implementation uses Vite, TypeScript, and Phaser.

## Scripts

```sh
npm run dev
npm run build
npm run preview
```

## Current Scope

The current phase provides the core playable loop:

- Boot scene
- Menu scene with a Start button
- Bridge Builder play scene with 8 generated math rescue steps
- 3 number planks per step
- visual plank-count prompts with a small equation hint
- gentle wrong-answer feedback without score penalties
- score, streak, bridge progress, and combo feedback
- Result scene with a Restart button

Asset production, advanced animation polish, audio, and app integration belong
to later phases.
