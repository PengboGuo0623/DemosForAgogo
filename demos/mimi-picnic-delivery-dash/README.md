# Mimi Bunny's Picnic Delivery Dash

Runnable entry: `index.html`

Original source file: `mimi_picnic_delivery_dash_v8_playfeel_plus.html`

This demo is kept as a standalone HTML file so it can be opened directly, hosted as static content, or embedded in a WebView test flow.

## H5 Polish Notes

- Stage-level countdown pill with urgent-state animation.
- Animated start-card preview of the catch-and-deliver loop.
- Full pause overlay with resume and start-over controls.
- Gentler first-miss feedback and short soft-assist window.
- Reduced-motion fallback for users who prefer less animation.
- v8.3 improves mobile spacing, keeps guide hands off the target, shortens the HUD title, and tunes drag speed/drop speed for a smoother feel.
- v8.4 tightens drag response, recalculates catch distance after attraction, adds drag basket glow, and shows a soft attraction trail when treats are being pulled in.
- v8.5 compacts the mobile HUD, order card, score chips, and stage overlays so the playable area gets more first-screen space.
- v8.6 expands the compact breakpoint for narrow Chrome/WebView previews, removes the duplicate in-stage Joy card on compact screens, and shortens order labels.
- v8.7 strengthens catch feedback with basket munch motion, snack score badges, larger ripples, stronger particles, and clearer combo/Joy callouts.
- v8.8 smooths catch timing, slows the snack-to-basket arc, damps post-catch player velocity, and removes automatic drift when the basket becomes full.
- v8.9 delays the final catch-to-delivery transition so the character stays visible through the third-round catch feedback.
- v8.10 fixes the Bubble Shield state class so the shield aura appears without making Mimi transparent.

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
