# Art Workflow Reference

Use this when generating, replacing, or adjusting flat UI art resources.

## Project Docs

For projects using this workflow, read:

1. `docs/ArtResourceGuide.md`
2. `docs/ArtProductionWorkflow.md`
3. `docs/ArtStyleDecisionLog.md`
4. `docs/ArtAssetReplacementMap.md`

If a project does not have these docs, create a small asset table before generating a batch.

## Style Ownership

This skill owns the production method, not a specific project's final visual identity.

- Project-specific art style belongs in project docs, especially `docs/ArtResourceGuide.md`.
- Do not create a separate art-style skill until the same style must be reused across multiple projects.
- If project docs and this skill disagree, follow the project docs for visual style and update the skill only for generalizable workflow rules.

## Style Summary

Default target:

```text
Bright clean cute Q-version western magic mobile game art.
Low-to-medium saturation, polished 2D hand-painted cartoon rendering, rounded soft shapes, medium clean outlines, soft cel shading, warm cream, soft honey-gold, pale orange, fresh cyan, mint green, soft blue shadows, small western magic motifs such as runes, crystals, parchment, soft metal, leather, wood, and arcane glow.
No baked text, no baked numbers, no watermark.
```

## UI vs Background

Background:

- softer contrast
- lower visual weight
- calmer zones behind UI
- fewer sharp outlines

UI:

- clearer silhouette
- stronger border
- slightly higher contrast
- soft dark grounding or shadow on bright scenes

Accepted main-scene rule:

- use pale cyan-cream or cool-tinted centers for bottom docks over bright castle scenes
- warm gold/orange buttons are fine, but need stronger edge definition and soft shadow
- high opacity may be better for interaction panels; `0.9` worked well for the main scene bottom dock

## Nine-Slice Assets

For buttons, panels, title bars, and input backgrounds:

- keep stretchable centers flat or near-flat
- keep borders stable and uniform
- put decorations in corners/fixed caps/separate overlays
- avoid noisy center textures
- avoid large gradients crossing the stretch area

## Output Rules

- Final assets go into project folders, not temporary directories.
- Existing assets should usually be overwritten in-place after approval.
- Keep original dimensions unless the user asks to change layout.
- Do not create `.meta` manually.
- Delete review/source/contact/comparison files after final integration.
- Update `docs/ArtAssetReplacementMap.md` for generated/replaced formal assets.

## Folder Defaults

| Asset Type | Folder |
| --- | --- |
| Large backgrounds/loading/map images | `assets/bigImg` or `assets/map` |
| Common UI | `assets/ui/common/imgs` |
| Main scene UI | `assets/ui/mainscene/imgs` |
| Battle UI | `assets/ui/battle` |
| Login/loading/startup UI | `assets/startupUI/.../imgs` |
