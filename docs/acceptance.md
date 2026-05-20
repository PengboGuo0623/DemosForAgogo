# Math Rescue Acceptance Criteria

## Phase 1 Documentation Acceptance

This documentation phase is complete when the repository contains:

- `AGENTS.md`
- `docs/product-brief.md`
- `docs/game-spec.md`
- `docs/ux-spec.md`
- `docs/art-direction.md`
- `docs/acceptance.md`
- `docs/implementation-plan.md`

This phase must not:

- initialize a Vite project
- create `src/`
- run `npm install`
- delete files
- alter historical demos

## MVP Functional Acceptance

The future MVP implementation is acceptable when:

- the demo can run in a browser as an H5/Web experience
- the game starts from a friendly start screen
- the player can complete one full 8-question session
- each question presents exactly 3 answer choices
- each question has exactly 1 correct answer
- each question has exactly 2 distractors
- question content stays within addition/subtraction within 10 and simple
  addition/subtraction within 20
- the result screen appears after the 8th question
- the player can restart the session

## UX Acceptance

The future MVP should pass these checks:

- mobile portrait layout is the primary design target
- answer buttons are large and easy to tap
- instructions are minimal
- numerals and operators are readable
- progress through 8 questions is visible
- correct answers produce clear positive feedback
- wrong answers produce gentle, non-shaming feedback
- the game does not use harsh failure language
- the full session target is about 60-90 seconds

## Technical Acceptance

The future implementation should:

- use Vite
- use TypeScript
- use Phaser
- live under `demos/math-rescue/`
- avoid dependencies on App SDKs or native bridges
- avoid network calls for core gameplay
- avoid requiring user accounts or backend services
- keep historical demo folders intact

## Originality Acceptance

The future implementation must not copy Lingokids or any other product's:

- characters
- UI pages
- illustrations
- sound effects
- music
- copywriting
- brand assets
- recognizable mascot or visual identity

The implementation may use common high-level children's education principles
only: bright, rounded, cartoon-like, short, low-frustration, high-feedback, and
low-text.

## Basic Verification Plan

Before considering the MVP complete, verify:

- local dev server opens the demo
- production build completes
- one full playthrough completes without console errors
- at least one mobile viewport check passes
- no `src/` or code project was created during documentation-only phase
- no historical demo files were deleted
