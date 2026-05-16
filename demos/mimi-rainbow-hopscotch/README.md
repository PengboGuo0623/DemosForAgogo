# Mimi Rainbow Hopscotch

Mobile-first standalone H5 runner demo for the Mimi children animation app.

## Gameplay

Mimi runs along three rainbow lanes. The player taps or swipes to switch lanes, collects the current friend's charm, dodges sleepy clouds, and grabs rainbow boosts for a short invincible scoring burst.

## Files

- `index.html`: Complete single-file H5 game with inline CSS and JavaScript.

## App Integration Notes

The demo can run as a plain static file and also emits lightweight bridge events:

- `GAME_READY`
- `GAME_STARTED`
- `LANE_CHANGED`
- `CHARM_COLLECTED`
- `BOOST_STARTED`
- `OBSTACLE_HIT`
- `ROUND_COMPLETED`
- `GAME_PAUSED`
- `GAME_RESUMED`
- `GAME_FINISHED`

Version: v1.0.
