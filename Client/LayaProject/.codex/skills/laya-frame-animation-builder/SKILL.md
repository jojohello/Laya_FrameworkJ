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

1. Confirm action names, inclusive start/end frame indices, cell size, foot anchor, style, and team-color regions.
2. Generate atlas entries from each action's authored range; actions may have different lengths.
3. Run `tools/art/build_character_frame_atlas.py`; do not manually slice final resources.
4. Inspect the PNG at original resolution. Reject spill, clipping, inconsistent feet, discontinuity, or incorrect masks.
5. Require `.png` suffixes on every atlas frame name and runtime subtexture URL.
6. Update the unique CSV under `Config/csv/`, then run the Config exporter. Never hand-edit generated JSON.
7. Load the atlas through `ResourceMgr` and `ResFrameAnimation`; pass cached subtexture URLs to `Laya.Animation.images`.
8. Preserve the configured action set; keep a static fallback for incomplete characters.
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
- Current project animation contract: keep authored metadata minimal as `actionName`, inclusive `startFrameIndex`, and `endFrameIndex`. The owning character resource supplies file context; do not duplicate `characterId` in every action record. Playback is continuous through the range; do not add `nextAction`, event markers, or an action graph unless a later confirmed requirement needs them. The owning Entity update advances its `ResFrameAnimation` with scaled scene delta time; `ResourceMgr` owns loading, references, pooling, and disposal. Defer a centralized renderer until large-unit profiling proves it necessary.
