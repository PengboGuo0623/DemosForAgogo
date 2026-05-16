# DemosForAgogo

A small static gallery for standalone HTML demos.

## Structure

- `index.html`: the demo gallery entry point.
- `demos/manifest.json`: demo metadata for humans and tooling.
- `demos/<demo-id>/index.html`: one runnable demo per folder.
- `demos/<demo-id>/README.md`: short notes for that demo.

## Current Demos

- `mimi-picnic-delivery-dash`: Mimi Bunny's Picnic Delivery Dash, a single-file App-ready H5 catch-and-deliver game.
- `mimi-bubble-pop-parade`: Mimi Bubble Pop Parade, a single-file App-ready H5 tap-and-pop rhythm game.
- `mimi-rainbow-hopscotch`: Mimi Rainbow Hopscotch, a single-file App-ready H5 lane runner game.

## Adding Another HTML Demo

1. Create a kebab-case folder under `demos/`.
2. Put the new HTML file at `demos/<demo-id>/index.html`.
3. Add the demo metadata to `demos/manifest.json`.
4. Add a card for the demo in the root `index.html`.
