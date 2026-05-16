# Mimi Bunny's Picnic Delivery Dash

Runnable entry: `index.html`

Original source file: `mimi_picnic_delivery_dash_v8_playfeel_plus.html`

This demo is kept as a standalone HTML file so it can be opened directly, hosted as static content, or embedded in a WebView test flow.

## App Integration

The game is designed as a short episode bonus interaction for a kids animation app. It has no external assets, network calls, ads, or third-party tracking.

Supported URL parameters:

- `episodeId`: host app episode identifier.
- `sessionId`: host app play/session identifier.
- `activityId`: host app activity identifier.
- `locale`: locale hint, currently stored in bridge context.
- `sound`: `true` or `false`.
- `haptics`: `true` or `false`.
- `autoStart`: `true` or `false`.
- `exitLabel`: label for the final close button.
- `totalSeconds`: round length, clamped from 30 to 180 seconds.

Supported inbound messages:

- `CONFIGURE_GAME` or `SET_GAME_CONTEXT`: update context and runtime options.
- `START_GAME`
- `PAUSE_GAME`
- `RESUME_GAME`
- `RESTART_GAME`
- `SET_SOUND`
- `SET_HAPTICS`

Outbound bridge events:

- `GAME_READY`
- `GAME_CONFIGURED`
- `GAME_STARTED`
- `GAME_PAUSED`
- `GAME_RESUMED`
- `ORDER_STARTED`
- `ITEM_COLLECTED`
- `POWER_UP_USED`
- `ASSIST_TRIGGERED`
- `SNACK_WAVE_STARTED`
- `RAINBOW_PARTY_STARTED`
- `DELIVERY_READY`
- `ORDER_DELIVERED`
- `GAME_FINISHED`
- `CLOSE_GAME`

Bridge delivery is attempted in this order: React Native WebView, iOS WebKit message handler, Android bridge, then parent iframe postMessage.
