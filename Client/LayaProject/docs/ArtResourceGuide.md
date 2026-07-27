# Art Resource Guide

## Purpose

This is the entry document for future flat art asset work.

Before generating or replacing art assets, read this file first, then follow the linked source documents only when needed.

## Read Order

1. `docs/ArtResourceGuide.md`
   - Quick entry point.
   - Use this to recover the current art direction, workflow, and cleanup rules.
2. `docs/ArtProductionWorkflow.md`
   - Full production workflow.
   - Use this when planning a new screen or asset batch.
3. `docs/ArtStyleDecisionLog.md`
   - Style decisions and reasons.
   - Use this when deciding whether a generated result matches the locked style.
4. `docs/ArtAssetReplacementMap.md`
   - Current final asset list and status.
   - Use this before replacing an existing file or adding a new formal asset.
5. `docs/ArtAssetAudit.md`
   - Historical audit.
   - Use only for context; the source of truth is now the replacement map.

## Locked Art Direction

The accepted style is the v4 western magic cute style.

Core description:

```text
Bright clean cute Q-version western magic mobile game art.
Low-to-medium saturation, polished 2D hand-painted cartoon rendering, rounded soft shapes, medium clean outlines, soft cel shading, warm cream, soft honey-gold, pale orange, fresh cyan, mint green, soft blue shadows, small western magic motifs such as runes, crystals, parchment, soft metal, leather, wood, and arcane glow.
No baked text, no baked numbers, no logo unless the asset is explicitly a branding/loading asset.
```

Avoid:

- high-saturation RPG premium gloss
- heavy dark fantasy mood
- sci-fi or modern tech motifs
- eastern fantasy motifs
- casino-like gold overload
- complex gradients in stretchable nine-slice centers
- keeping review/source/contact/comparison images after final integration

## UI And Background Layering Decision

This is now a locked practical rule.

Backgrounds and UI should belong to the same western magic world, but they must not have the same visual weight.

Backgrounds:

- bright and friendly
- low-to-medium saturation
- softer contrast
- fewer sharp outlines
- calmer areas behind UI
- atmospheric depth is allowed
- avoid dense detail behind buttons, labels, and progress bars

UI:

- slightly stronger contrast than background
- clearer silhouette and border
- more stable shape language
- readable at small size
- warmer highlights are allowed, but not neon
- use soft dark grounding or outline when placed over bright scenes

Main scene decision from the accepted result:

- bottom dock panels should not share the same cream/stone color as castle walls or ground
- the current bottom-navigation dock uses a dark desaturated gray-blue center related to the top HUD, while lighter cyan-cream remains suitable for secondary information panels
- main feature buttons may keep warm gold/orange, but need stronger edge definition and soft shadow/grounding
- primary UI panels can use high opacity when they carry interaction; `0.9` worked better than `0.7` for the main scene bottom dock

Recommended hierarchy:

```text
Background: low-to-medium saturation, soft contrast
Dock/panel base: pale cyan-cream or clean parchment with clear border, medium contrast
Buttons/icons: medium contrast, stronger outline/shadow, warm gold or cyan accents
Reward/important UI: highest contrast, but still not neon/high saturation
```

## Nine-Slice Rule

For panels, title bars, buttons, and input backgrounds:

- keep center areas flat or near-flat
- keep borders stable and uniform
- put decoration in corners, fixed caps, or separate overlays
- avoid large gradients crossing stretchable centers
- avoid noisy texture in the stretchable center
- render labels with Laya text, not inside PNGs

## Asset Integration Rules

- Laya-referenced icons should be independent small PNGs.
- Reuse an existing asset only when its meaning, silhouette, style, and intended display size all fit the new role. Do not assemble a formal UI from merely similar resources to avoid adding a file.
- When no suitable reusable asset exists, create a new formal PNG. If it needs a `res://` reference, place the PNG in its final folder, ask the user to open LayaAir IDE to generate `.meta`, and continue integration only after reading the IDE-generated UUID.
- Keep original filenames when replacing existing resources.
- Directly overwrite old PNGs after the style/result is accepted.
- Do not manually create `.meta`; let Laya generate or update them.
- Keep existing `.meta` files when only replacing PNG contents.
- Record final assets in `docs/ArtAssetReplacementMap.md`.
- Remove temporary trial/review/source/contact/comparison images after final integration.

## Folder Rules

Current project conventions:

| Asset Type | Folder |
| --- | --- |
| Large backgrounds/loading/map images | `assets/bigImg` or `assets/map` |
| Common UI | `assets/ui/common/imgs` |
| Main scene UI | `assets/ui/mainscene/imgs` |
| Battle UI | `assets/ui/battlescene/imgs` |
| Login/loading/startup UI | `assets/startupUI/.../imgs` |

## Standard Prompt Block

Use this as the base prompt for future generation:

```text
Polished 2D mobile game asset, Q-version western magic adventure style, bright clean cute art direction with moderate detail, hand-painted cartoon illustration, rounded soft shapes, medium clean outlines, readable silhouettes, gentle top-left highlights, soft cel shading, low-to-medium saturation, fresh mint/cyan accents, soft honey-gold UI accents, warm cream highlights, western magic motifs such as small runes, crystals, parchment, soft metal, leather, wood, and arcane glow, high readability at small size, cute friendly mood, no text, no numbers, no logo, no watermark.
```

For UI panels/buttons, add:

```text
Use nine-slice-friendly structure: flat or near-flat stretchable center, stable border thickness, decoration only in corners or fixed caps, reduced gold saturation and glossy contrast, no complex gradients or noisy texture in stretchable areas.
```

For UI over a bright scene, add:

```text
Ensure clear separation from a bright pastel fantasy background: slightly stronger border, soft dark grounding/shadow, and a panel center hue that does not merge with castle stone, grass, or sky.
```

## Current Final Assets

Use `docs/ArtAssetReplacementMap.md` as the source of truth.

Important accepted examples:

- `assets/bigImg/loading_bg.png`
  - Framework/login loading background.
  - Must keep `Framework-J` identity and the centered wizard identity if redesigned.
  - Lower third should remain clean for login inputs and loading/progress UI.
- `assets/map/map001/map001.png`
  - Bright western magic kingdom scene background.
  - Should stay softer than foreground UI.
- `assets/ui/mainscene/imgs/bottom-panel.png`
  - Accepted gray-blue nine-slice bottom-dock treatment used by the finalized main navigation.
  - Compact `256x96` source displayed at `750x279`; warm navigation buttons remain the foreground emphasis.
- `assets/ui/mainscene/imgs/btn-bg-yellow.png`
  - Accepted warm button treatment.
  - Needs stronger edge and soft grounding over bright scenes.
- `assets/ui/battlescene/imgs/stage_node_*.png`
  - Accepted battle stage node direction.
  - Independent icon assets with clear silhouettes.

## Checklist Before Finishing Future Art Work

- Does the result match v4 western magic cute style?
- Is the UI clearer than the background without feeling pasted on?
- Are backgrounds softer and calmer behind UI?
- Are buttons/icons readable at intended size?
- Are text and numbers rendered by Laya unless explicitly required?
- Are nine-slice centers clean enough to stretch?
- Are final files saved to the correct project folders?
- Were old filenames preserved where needed?
- Were `.meta` files left alone?
- Were temporary source/review/contact/comparison images deleted?
- Was `docs/ArtAssetReplacementMap.md` updated?
