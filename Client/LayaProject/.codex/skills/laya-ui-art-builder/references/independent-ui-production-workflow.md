# Independent Laya UI Production Workflow

Use this workflow for a new self-contained screen, a full component redesign, or any UI that requires a complete visual concept followed by production slicing and `.lh`/`.ls` assembly.

## 1. Collect the minimum design contract

Do not generate art until these fields are known or safely inferred:

| Field | Required decision |
| --- | --- |
| Purpose and entry | What opens the UI and what the player accomplishes |
| UI layer | Screen UI, modal UI, guide UI, or scene-space HUD |
| Design canvas | Default project canvas is `750x1335`; verify the target `.ls` because legacy files can differ by one pixel |
| Safe area | Top notch/status area, bottom gesture area, and device adaptation behavior |
| Logical bounds | Intended `x/y/width/height` on the full canvas, not only source-image dimensions |
| Occupancy | Approximate percentage of canvas width and height the UI may consume |
| Information | Labels, values, icons, lists, progress, and empty/error/loading states |
| Interaction | Buttons, controllers, callbacks, mask behavior, close rules, and disabled states |
| Data ownership | Runtime fields and managers/protocols that provide each value |
| Reference | User screenshot, approved project screen, or an explicitly requested new direction |

Ask for a reference only when structure or style cannot be inferred. Do not confuse screen UI with scene-space HUD merely because both contain bars or status values.

## 2. Audit before drawing

1. Read `docs/ArtResourceGuide.md` and the needed art decision/replacement documents.
2. Read `assets/ui/UI_RESOURCE_INDEX.md`.
3. Inspect `assets/ui/common/` first, then the target module folder.
4. Search both filenames and `.meta` UUIDs in `.ls`, `.lh`, TypeScript, configs, and docs.
5. Reuse a common resource when role, states, proportions, and style match. Similar appearance alone is insufficient.
6. Add a new common resource only when at least two screens can reasonably share its meaning; otherwise keep it module-specific.

Record an asset table before production: role, target runtime size, source size, alpha, common/module location, nine-slice behavior, text baked in, states, and status.

## 3. Design the complete composition first

1. Produce the entire UI on a `750x1335` preview canvas or inside an equivalent screenshot of the target screen.
2. Draw the intended logical bounding box and evaluate it against the full screen. A top status component should not become full-width merely because the image generator returns a wide image.
3. Include every important element in the concept: panels, avatar/icon anchors, labels, values, buttons, progress, and spacing.
4. Judge hierarchy, density, color, silhouette, and relation to existing screen UI before judging individual decoration.
5. Obtain user approval of the overall effect before slicing production assets.

Approval is a gate. Do not treat an isolated attractive panel as proof that the assembled screen will work.

## 4. Convert the approved concept into a production plan

Separate the concept by behavior:

- Fixed bitmap: icons, fixed caps, portrait frames, decorative overlays.
- Nine-slice bitmap: panels, buttons, title bars, and tracks with flat stretchable centers.
- Laya text: names, titles, levels, amounts, percentages, and all changing numbers.
- Runtime shape/mask: simple clipping or debug fallback only; do not use it to replace approved finished art.
- Repeated structure: prefab/list item instead of copied nodes.

Set target PNG dimensions close to intended runtime display size. Keep only enough resolution for the device scale policy; do not retain generator-sized assets when the UI displays them at a few dozen pixels.

## 5. Generate and slice assets

1. Prefer a single approved production sheet for tightly related assets so material, outline, light direction, and palette remain consistent.
2. Use a flat chroma-key background for opaque cutouts when transparency is needed.
3. Keep subjects separated with predictable cells and generous padding.
4. Slice, remove chroma, crop transparent padding, and resize to declared target dimensions.
5. Inspect at both original size and intended display size.
6. Reject colored fringes, accidental baked text/numbers, inconsistent borders, mismatched light, or excessive empty pixels.
7. Save formal assets directly to their canonical project role; never keep source sheets or review images under `assets/`.

For a generated production sheet, use the project helper so crop, chroma removal, transparent padding, and target size stay reproducible:

```powershell
python tools/art/chroma_replace.py --input <sheet.png> --crop X,Y,WIDTH,HEIGHT --output <asset.png> --size WIDTHxHEIGHT
```

## 6. Import and choose `.lh` or `.ls`

- Use `.lh` for reusable panels, status bars, buttons, list items, and independent components.
- Use `.ls` for a complete screen, modal layer container, runtime entry, or validation scene.
- Compose a screen `.ls` from `.lh` prefabs when the component has an independent role or will be revised separately.

Never hand-create `.meta`. After LayaAir imports assets, read every actual UUID before writing `res://` references. Prefer a prefab instance in `.ls` when editor-time visibility and stable composition matter.

## 7. Assemble at logical size

1. Author node positions against the target canvas, not against source PNG dimensions.
2. Set the root component bounds first, then place children relative to that box.
3. Keep source texture resolution independent from logical `width/height`.
4. Preserve existing `_$id`, `_$prefab`, `_$runtime`, `_$override`, relations, and controller fields unless the change requires them.
5. Keep visual nodes named by role so runtime binding does not depend on child order.
6. Keep art and business behavior separate: resources define composition; runtime code supplies values and callbacks.

## 8. Validate in context

Check at `750x1335` and at the actual target device ratio:

- occupied width/height and distance from safe edges
- text readability without dominating the scene
- icon scale relative to adjacent controls
- shared border thickness, material, color temperature, saturation, and shadow direction
- semantic colors remain distinct without making the component look like mixed asset packs
- controller states, callback reachability, modal input interception, and adaptation relations
- no delayed pop-in when a prefab should be editor-visible

Parse `.ls/.lh` JSON, resolve every UUID, run TypeScript and project document checks, then obtain an IDE screenshot. Use that screenshot for one targeted correction pass.

## 9. Consolidate and clean resources safely

Before deleting a suspected duplicate:

1. Compare semantic role, visual state, target size, and usage—not only file hash.
2. Choose one canonical filename, normally under `assets/ui/common/` for reusable meaning.
3. Preserve the canonical `.meta` UUID when replacing its bitmap content.
4. Change all serialized UUIDs, runtime paths, resource indexes, and art maps to the canonical resource.
5. Search again for both the duplicate filename and duplicate UUID.
6. Parse affected `.ls/.lh` and verify all remaining UUIDs resolve.
7. Delete the redundant PNG and its `.meta` only after migration succeeds.

Do not merge resources that only look similar but represent different states, interaction meanings, or scaling contracts.

## Repeated failure prevention

- Do not build from individual attractive pieces before approving the whole composition.
- Do not let a generic background panel determine information hierarchy.
- Do not design in an unspecified floating canvas; use `750x1335` and explicit occupancy targets.
- Do not infer logical size from generated bitmap size.
- Do not keep a module duplicate when a canonical common resource can express the same role.
- Do not write `res://` IDs from memory or fabricate `.meta` files.
- Do not bake mutable labels or numbers into PNGs.
- Do not call style unified until border weight, material, palette, icon scale, and shadow direction have been reviewed together in the real screen.
