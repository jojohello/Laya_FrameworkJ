# LS/LH Editing Checklist

Use this checklist before finalizing Laya UI file edits.

## Before Editing

- Identify whether the task is asset replacement, layout adjustment, or new UI creation.
- Read the target `.ls`/`.lh` file fully.
- Search for related prefabs and generated TypeScript files.
- Check whether image assets are referenced by `res://` ids or file paths.

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
- Run TypeScript checks only if code changed or generated bindings are affected.
- Report any Laya IDE step the user must perform, such as regenerating `.meta` or generated views.

## Art Finish

- Confirm UI is visually separated from scene backgrounds.
- Confirm temporary review/source/contact/comparison images were removed.
- Confirm `docs/ArtAssetReplacementMap.md` is updated for final assets.
