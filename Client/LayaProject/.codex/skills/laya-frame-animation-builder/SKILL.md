---
name: laya-frame-animation-builder
description: Create, pack, configure, integrate, debug, and validate LayaAir 3.3 atlas frame animations for this project. Use for idle/walk/attack sprite art, one-PNG-plus-atlas resources, CharacterAnimation configuration, ResFrameAnimation playback, team-color mask synchronization, or unsupported suffix and null sourceWidth errors.
---

# Laya Frame Animation Builder

Build frame animation as one large PNG plus a `.atlas`; never ship an undescribed grid or many loose frame files.

## Read

1. Read the root and nearest scoped `DESIGN.md` and `README.md` files.
2. Read [references/art-pipeline.md](references/art-pipeline.md) for image generation and atlas building.
3. Read [references/runtime-integration.md](references/runtime-integration.md) for playback, Shader integration, lifecycle, and diagnosis.

## Execute

1. Confirm actions, frame count, cell size, foot anchor, style, team-color regions, and character ID.
2. Generate one action per row with chronological frames from left to right.
3. Run `tools/art/build_character_frame_atlas.py`; do not manually slice final resources.
4. Inspect the PNG at original resolution. Reject spill, clipping, inconsistent feet, discontinuity, or incorrect masks.
5. Require `.png` suffixes on every atlas frame name and runtime subtexture URL.
6. Update the unique CSV under `Config/csv/`, then run the Config exporter. Never hand-edit generated JSON.
7. Load the atlas through `ResourceMgr` and `ResFrameAnimation`; pass cached subtexture URLs to `Laya.Animation.images`.
8. Preserve `idle`, `walk`, and `attack`; keep a static fallback for incomplete characters.
9. Synchronize base and mask textures on every frame when team-color Shader rendering is enabled.
10. Clear timers, events, materials, parents, and resource references during recycle and disposal.
11. Run automated checks and require LayaAir IDE runtime validation.

## Guardrails

- Use runtime URLs relative to `assets/`; never add an `assets/` prefix.
- Let LayaAir IDE generate `.meta` files.
- A raw grid PNG is not directly playable by `Laya.Animation`; `.atlas` defines its subtextures.
- Suffixless atlas keys are not cached by LayaAir 3.3 and cause `unsupported suffix` followed by null `sourceWidth`.
- Do not tint the whole character. Pair selective mask frames with base frames and update both UV rectangles.
- Verify transitions, team colors, scene re-entry, and object-pool reuse in LayaAir IDE.
