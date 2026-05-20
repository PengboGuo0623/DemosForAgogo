# Math Rescue Implementation Plan

## Phase 1: Documentation and Project Rules

Create product and engineering documents only.

Deliverables:

- repository agent guide
- product brief
- game spec
- UX spec
- art direction
- acceptance criteria
- implementation plan

Constraints:

- do not initialize the code project
- do not create `src/`
- do not run `npm install`
- do not delete files
- keep `demos/` and historical demos intact

## Phase 2: Project Initialization

Create an independent Vite + TypeScript + Phaser project under
`demos/math-rescue/`.

Expected deliverables:

- `package.json`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- minimal Phaser entry point
- basic README for running the demo

Do not implement the full game in this phase. The goal is only to show a
working Phaser canvas in the browser.

## Phase 3: Game State Flow

Implement the minimum scene flow:

- Boot
- Start
- Game
- Result
- Restart

Acceptance for this phase:

- user can enter the game from the start screen
- user can reach a result screen through a temporary or simple path
- restart returns to a playable state

## Phase 4: Core Math Gameplay

Implement the 8-question math loop.

Required behavior:

- generate questions from structured rules
- support addition/subtraction within 10
- support simple addition/subtraction within 20
- generate exactly 3 answer options
- ensure exactly 1 correct answer
- ensure 2 unique distractors
- track question progress and correct answers

Default wrong-answer behavior:

- keep the question active
- allow another choice
- show gentle feedback

## Phase 5: Child-Friendly Feedback and Animation

Add the rescue theme and emotional feedback.

Expected additions:

- original rescue character or friend visuals
- visible 8-step rescue progress
- correct-answer celebration
- gentle wrong-answer nudge
- result celebration
- short and supportive UI copy

Use code-drawn Phaser visuals for the MVP unless a later task explicitly adds
bitmap assets.

## Phase 6: Mobile Portrait Adaptation

Tune layout and interaction for mobile portrait.

Checks:

- answer buttons remain large
- UI does not overlap on narrow screens
- question text remains readable
- progress HUD stays visible
- important controls avoid screen edges
- game remains usable in desktop browser preview

## Phase 7: Acceptance and Fixes

Run final MVP verification.

Expected checks:

- development preview opens successfully
- production build succeeds
- full 8-question playthrough works
- mobile viewport screenshot or manual check passes
- no App SDK integration is present
- no third-party product assets are copied
- historical demos are still present

## Recommended Next Step

After Phase 1 is accepted, initialize the Vite + TypeScript + Phaser project
inside `demos/math-rescue/` and create only the minimal working Phaser canvas.
