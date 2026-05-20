# Repository Agent Guide

## Project Context

This repository hosts standalone browser demos. The current new workstream is
`Math Rescue`, a lightweight math education game demo for children ages 5-8.

The demo is an H5/Web showcase only. A future host may be an app, but this
phase must not integrate any App SDK, native bridge, login, tracking, payment,
ads, or production backend.

## Required Technical Direction

- Use `Vite + TypeScript + Phaser` for the new Math Rescue demo.
- Build the demo as an independent project under `demos/math-rescue/` in the
  next phase.
- Keep the root gallery and existing demo history intact unless a future task
  explicitly asks to update metadata or gallery links.
- Do not initialize the code project during the documentation phase.
- Do not create `src/` during the documentation phase.
- Do not run `npm install` unless a later task explicitly asks for project
  initialization or dependency installation.

## Repository Rules

- The `demos/` directory must be preserved.
- Existing demo folders are historical records and must not be deleted,
  rewritten, or used as source code for Math Rescue unless explicitly requested.
- Do not delete files as part of planning or documentation work.
- Keep changes scoped to the requested phase.
- Prefer clear documentation before implementation when product behavior is
  still being defined.

## Product Guardrails

Math Rescue should follow high-level children's education experience principles:

- bright and friendly visuals
- rounded and readable UI
- cartoon-like original presentation
- short sessions
- low frustration
- strong positive feedback
- minimal text
- clear visual guidance

These are principles only. Do not copy Lingokids or any other product's
specific characters, UI screens, illustrations, sound effects, copywriting,
brand assets, colors arranged as a recognizable brand system, mascots, or
interaction sequences.

## Development Expectations

- Design mobile portrait first.
- Keep the first playable session short: 8 questions in about 60-90 seconds.
- Make answer buttons large enough for children.
- Treat wrong answers gently. Avoid harsh failure states.
- Favor visual feedback over long written instructions.
- Keep math content within the defined scope: addition/subtraction within 10
  and simple addition/subtraction within 20.

## Verification Expectations

Future implementation work should verify:

- the demo opens in a browser
- the game can complete one full 8-question session
- every question has exactly one correct answer and two distractors
- mobile portrait layout is readable and touch-friendly
- no App SDK or network dependency is required
- no copied third-party product assets are present
