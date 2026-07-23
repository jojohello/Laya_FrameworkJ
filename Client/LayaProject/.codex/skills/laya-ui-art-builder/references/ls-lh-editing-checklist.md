# LS/LH Editing Checklist

Use this checklist before finalizing Laya UI file edits.

## Before Editing

- Identify whether the task is asset replacement, layout adjustment, or new UI creation.
- For every scalable background, decide whether nine-slice is required before producing art.
- Read the target `.ls`/`.lh` file fully.
- Search for related prefabs and generated TypeScript files.
- Check whether image assets are referenced by `res://` ids or file paths.
- For existing nine-slice candidates, inspect the PNG dimensions and `.meta` `importer.sizeGrid`; do not assume the filename or visual shape proves it is configured.

## During Editing

- Keep edits minimal.
- Preserve `_$id`, `_$prefab`, `_$runtime`, `_$override`, and `relations` unless intentionally changing structure.
- Keep Laya 3 `G*` component types.
- Keep labels in Laya text instead of baking text into images.
- For repeated UI, prefer list/prefab patterns already in the screen.

## After Editing

- Parse edited `.ls`/`.lh` as JSON when possible.
- Verify referenced files exist.
- Verify PNG dimensions when replacing images.
- For every intended nine-slice asset, verify compact source dimensions, measured fixed margins, `meta.importer.sizeGrid`, and an actual-runtime-size stretch preview with no corner deformation or center seam.
- Reopen or reimport the asset in LayaAir IDE to confirm the importer preserves `sizeGrid`.
- Run TypeScript checks only if code changed or generated bindings are affected.
- Report any Laya IDE step the user must perform, such as regenerating `.meta` or generated views.

## Art Finish

- Confirm UI is visually separated from scene backgrounds.
- Confirm large scalable panels do not retain full-screen source dimensions when a compact nine-slice source would preserve the design.
- Confirm temporary review/source/contact/comparison images were removed.
- Confirm `docs/ArtAssetReplacementMap.md` is updated for final assets.
