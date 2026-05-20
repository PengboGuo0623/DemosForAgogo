# Math Rescue Game Spec

## Core Loop

The child helps complete a rescue mission by answering simple math questions.
Each correct answer moves the rescue forward. Wrong answers are treated as
gentle learning moments, not failures.

Core loop per question:

1. Show a visual rescue situation.
2. Present one math question.
3. Present three large answer choices.
4. Player taps one answer.
5. Show feedback.
6. Advance rescue progress.
7. Continue until 8 questions are complete.

## Session Rules

- One session contains 8 questions.
- Target session length is 60-90 seconds.
- Each question has exactly 3 answer options.
- Each question has exactly 1 correct answer and 2 distractors.
- The game ends after the 8th question.
- The result screen should be celebratory regardless of mistakes.

## Math Scope

Supported MVP question types:

- addition within 10
- subtraction within 10
- simple addition within 20
- simple subtraction within 20

Recommended MVP distribution:

- early questions: easier addition/subtraction within 10
- middle questions: mixed within 10
- later questions: simple within 20

Avoid negative answers. Avoid equations that require carrying/borrowing in the
MVP unless a later requirement explicitly asks for it.

## Question Generation

The implementation should generate questions from structured rules rather than
hard-coded screen text.

Each generated question should include:

- left operand
- operator: `+` or `-`
- right operand
- correct answer
- two distractor answers
- difficulty band

Distractors should be plausible and child-safe:

- near the correct answer when possible
- non-negative
- unique
- not equal to the correct answer
- within a reasonable range for the question

## Answer Behavior

Correct answer:

- play a strong positive visual response
- advance rescue progress
- increment correct answer count
- move to the next question after a short pause

Wrong answer:

- show a soft, non-punitive response
- avoid scary, harsh, or shame-based feedback
- let the child continue without ending the session
- use short copy such as "Try again" or "Almost"

Default MVP behavior: after a wrong answer, keep the same question active and
allow another choice. If future playtests show this slows the session too much,
the behavior can be adjusted.

## Game States

Required MVP states:

- Boot: initialize Phaser and basic assets.
- Start: show title, mission prompt, and start button.
- Playing: show question, options, rescue scene, progress, and feedback.
- Feedback: brief correct/wrong response between interactions.
- Result: show completion celebration and restart option.

## Scoring and Progress

The MVP should keep scoring simple:

- `questionsAnswered`: number of completed questions
- `correctAnswers`: number of questions eventually answered correctly
- `currentQuestionIndex`: 1-8 display progress
- `rescueProgress`: visual progress derived from completed questions

The result screen should emphasize completion and encouragement more than raw
performance.

## Content Tone

Use very short English UI copy for the MVP:

- "Math Rescue"
- "Start"
- "Help!"
- "Great!"
- "Try again"
- "You did it!"
- "Play again"

Keep text sparse. Prefer visual direction and animation over instructions.
