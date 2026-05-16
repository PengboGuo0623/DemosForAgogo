# Mimi Bubble Pop Parade

Runnable entry: `index.html`

This is a standalone mobile-first H5 tap game for the same kids animation app context as Mimi Bunny's Picnic Delivery Dash.

## Gameplay Notes

- Friends request specific floating bubbles.
- Players tap the matching bubbles to build a small parade song.
- Wrong sleepy bubbles are soft penalties instead of harsh failure.
- Three short rounds unlock a sticker-style finish.
- Includes lightweight WebView bridge events for app prototypes.

## App Integration

The demo has no external assets, network calls, ads, or third-party tracking.

Outbound bridge events:

- `GAME_READY`
- `GAME_STARTED`
- `BUBBLE_POPPED`
- `ROUND_COMPLETED`
- `GAME_PAUSED`
- `GAME_RESUMED`
- `GAME_FINISHED`

## Changelog

- v1.1 reduces opening and mid-round bubble density, spaces new bubbles away from recent spawns, and increases per-round goals for a less rushed session.
- v1.0 initial standalone bubble-pop demo.

Version: v1.1.
