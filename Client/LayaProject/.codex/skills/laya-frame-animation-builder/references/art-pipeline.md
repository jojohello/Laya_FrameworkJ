# Frame animation art pipeline

## Deliverable

Deliver one transparent PNG and one `.atlas` per character animation set. The current layout uses six columns and three base rows (`idle`, `walk`, `attack`), followed by three matching team-mask rows. With `128×160` cells, the final image is `768×960` with 36 atlas subtextures. Loose frames are temporary intermediates only.

## Source requirements

- Keep one action per row and chronological frames from left to right.
- Keep camera, proportions, lighting, equipment, and facing consistent.
- Align the logical foot point across frames.
- Make idle subtle, walk loopable, and attack a complete anticipation/strike/recovery sequence.
- Reserve coherent clothing regions for team masks; preserve skin, hair, metal, weapons, and most armor.
- Remove chroma spill before acceptance.

## Build

From `Client/LayaProject`, run:

```powershell
python tools/art/build_character_frame_atlas.py `
  --input tmp/frame-atlas/<character>-source.png `
  --output-png assets/character/<id>/character-animation.png `
  --output-atlas assets/character/<id>/character-animation.atlas `
  --prefix character/<id>/animation/ `
  --character-id <id> `
  --temp-dir tmp/frame-atlas/<id>
```

The processor removes chroma, normalizes silhouettes, aligns feet, builds selective masks, composes the large PNG, and writes atlas metadata.

## Accept

Inspect at original resolution: no spill or clipping; consistent scale and baseline; correct action order; acceptable loop endpoints; masks limited to intended regions; every base frame paired with matching mask geometry. Let LayaAir IDE generate `.meta` files.
