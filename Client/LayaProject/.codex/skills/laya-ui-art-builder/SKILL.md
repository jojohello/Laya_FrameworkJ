---
name: laya-ui-art-builder
description: Generate or adjust LayaAir 3 UI art assets, test/sample .ls scene files, .lh prefabs, and simple UI layouts for this project style. Use when Codex needs to create/replace PNG UI resources, inspect or edit Laya .ls/.lh JSON files, create simple test scenes under assets/testAndSample/editorResources, preserve Laya res:// references and meta handling, apply the project's western magic cute v4 art direction, or maintain art-resource workflow documentation.
---

# Laya UI Art Builder

## Core Rule

Use this skill for LayaAir UI art/resource work. Treat project docs as the source of truth for the current game's style and asset state.

Do not hard-code a project's full art style into this skill. This skill defines the working method; the current project style lives in project docs such as `docs/ArtResourceGuide.md`.

Before generating or replacing assets in a project, read the project's art entry document if present:

```text
docs/ArtResourceGuide.md
```

Then read only the needed follow-up docs, usually:

- `docs/ArtProductionWorkflow.md` for workflow and prompts
- `docs/ArtStyleDecisionLog.md` for style decisions
- `docs/ArtAssetReplacementMap.md` for final asset paths and status

## Workflow

1. Identify task type:
   - PNG art generation/replacement
   - `.ls/.lh` layout adjustment
   - simple prefab/screen creation
   - test/sample `.ls` scene creation
   - asset audit/cleanup
   - workflow documentation update
2. Read project art docs and relevant Laya UI files.
3. Prefer existing project patterns and existing UI resources.
4. Keep Laya-referenced icons as independent PNGs.
5. Preserve existing filenames and dimensions when replacing existing assets unless the user asks otherwise.
6. Do not manually create `.meta` files. Keep existing `.meta` files when only replacing PNG content.
7. For `.ls/.lh`, treat files as JSON-like Laya documents. Preserve IDs, prefab links, runtime links, and `res://` values unless intentionally changing a reference.
8. Validate after changes:
   - PNG dimensions
   - JSON parse for `.ls/.lh` when possible
   - missing references / stale temporary files
   - project docs updated

## When Editing `.ls` / `.lh`

Read `references/laya-ui-json-rules.md` before direct `.ls/.lh` edits.

Safe first-pass edits:

- `x`, `y`, `width`, `height`
- `alpha`, `visible`, `active`
- `name` for clear component naming
- `layout` gap/padding/alignment
- `src` only after confirming the target asset's `res://` mapping or the local file reference pattern

Avoid changing without a specific reason:

- `_$id`
- `_$prefab`
- `_$runtime`
- `_$override`
- `relations`
- unknown serialized fields

## When Creating Test Or Sample UI Scenes

Read `references/test-ui-layouts.md` before creating a new test/sample `.ls` or `.lh` file.

Project defaults:

- Put verification and usage-example scenes under `assets/testAndSample/`.
- Put editor-only test `.ls` scenes and their starter `.ts` scripts under `assets/testAndSample/editorResources/`.
- Prefer `.ls` for a runnable test scene and `.lh` for a reusable panel/prefab.
- Attach a small Runtime script to the root or explicit controller node when the scene exists to start a validation flow.
- Do not manually create `.meta` files.
- Use LayaAir 3 UI node types such as `GBox`, `GImage`, and `GTextInput` when authoring UI JSON directly.
- Do not use `assets/` in runtime load paths.
- Treat exclusion from formal builds as unverified unless a build rule or build output proves it.

## When Creating Or Replacing Art

Read `references/art-workflow.md` before generation/replacement.

Default style for this project family:

```text
Bright clean cute Q-version western magic mobile game art, low-to-medium saturation, polished 2D hand-painted cartoon, rounded soft shapes, medium clean outlines, soft cel shading, soft honey-gold, pale cyan, mint green, warm cream, small runes/crystals/parchment/soft metal/leather/wood/arcane glow, no baked text, no baked numbers, no watermark.
```

For UI over bright backgrounds:

```text
Keep UI clearer than the background: stronger border, readable silhouette, soft dark grounding/shadow, and panel hues that do not merge with castle stone, grass, or sky.
```

## Scripts

Optional scripts live in `scripts/`:

- `inspect_laya_ui.ps1`: list images and validate `.ls/.lh` JSON parsing.
- `list_png_assets.ps1`: list PNG assets and dimensions.

Read or run them when useful; they are helpers, not required for every task.

## Finish Checklist

Read `references/ls-lh-editing-checklist.md` when touching `.ls/.lh` or replacing UI resources.

Before final response:

- final assets are in project folders
- temporary review/source/contact/comparison images are removed
- `.meta` files were not manually authored
- dimensions are preserved where needed
- docs are updated when asset meaning/status changes
- any unverified risk is called out clearly
