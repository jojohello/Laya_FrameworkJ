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

Decide whether to use nine-slice before generating or editing the art. Prefer nine-slice when a panel, button, title bar, input background, progress track, dock, or other framed background:

- is displayed at sizes different from its source;
- may be reused at multiple sizes;
- contains a large flat or near-flat center;
- would otherwise keep a large full-resolution texture only to preserve borders.

Do not use nine-slice for fixed-size icons, portraits, irregular silhouettes, or artwork whose center texture and lighting must scale as one piece.

Before production:

1. Choose the compact source dimensions and the intended runtime dimensions.
2. Define fixed top, right, bottom, and left margins in source pixels.
3. Keep every corner ornament, border turn, cap, crystal, and non-stretchable highlight entirely inside those fixed margins.
4. Keep the horizontal, vertical, and center stretch zones flat or near-flat. Do not cross them with texture seams, noisy patterns, large gradients, text, or fixed decorations.

After production:

1. Let LayaAir IDE create the asset `.meta` and UUID.
2. Inspect `meta.importer.sizeGrid`. An asset intended for nine-slice is incomplete when this field is missing or does not match the designed margins.
3. In this project, confirmed LayaAir 3.3 samples use `[top, right, bottom, left, repeatFlag]`. Use measured source-pixel margins; do not copy another asset's numbers blindly.
4. When project rules allow it, maintain `sizeGrid` only in an existing IDE-generated `.meta` and only after confirming the same-version schema. Never create the `.meta`, change its UUID, or guess unknown importer fields.
5. Render or simulate the nine-slice at its actual runtime size. Confirm fixed corners and borders do not deform, the center has no seams, and the result still reads correctly over the target screen.
6. Reopen or reimport in LayaAir IDE and verify the importer preserves the field.

Nine-slice saves source texture space only when the compact source is materially smaller than the displayed panel. Adding `sizeGrid` to an already full-size texture improves scaling behavior but does not reduce its pixel footprint.

## Output Rules

- Final assets go into project folders, not temporary directories.
- Existing assets should usually be overwritten in-place after approval.
- Keep original dimensions unless the user asks to change layout or a confirmed nine-slice conversion intentionally uses a compact source.
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
