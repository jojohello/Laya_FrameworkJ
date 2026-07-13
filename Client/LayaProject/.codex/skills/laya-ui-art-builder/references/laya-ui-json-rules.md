# Laya UI JSON Rules

Use these rules when editing LayaAir 3 `.ls` and `.lh` files.

## File Nature

- `.ls` and `.lh` are JSON-like serialized Laya documents.
- Prefer structured JSON parsing/formatting when possible.
- Keep the existing field order/style as much as practical.

## Safe Fields

Usually safe to change after reading surrounding context:

- `x`, `y`, `width`, `height`
- `anchorX`, `anchorY`
- `alpha`, `visible`, `active`
- `name`
- `layout.type`, `layout.columnGap`, `layout.rowGap`, `layout.padding`, `layout.align`
- `left`, `right`, `top`, `bottom`
- `autoSize`

## Fragile Fields

Do not change these unless the task explicitly requires it and references are understood:

- `_$id`
- `_$runtime`
- `_$prefab`
- `_$override`
- `_$ref`
- `_$tmpl`
- `relations`
- `src` values using `res://...`

## Component Types

For this project, LayaAir 3 UI files use new UI component types:

- `GBox`
- `GImage`
- `GTextInput`
- `GList`

Avoid converting these to old non-G component names.

## Asset Paths

Runtime load paths often omit the `assets/` prefix in code.

Examples:

- Project file: `assets/startupUI/login/Login.lh`
- Runtime load path: `startupUI/login/Login.lh`

Do not rewrite working load paths unless the task is specifically about path correction.

## Editing Process

1. Read the full `.ls`/`.lh` file.
2. Identify the node by `name`, prefab id, or nearby structure.
3. Change only the fields needed for the task.
4. Parse the file as JSON after editing when possible.
5. If changing image references, verify the asset exists and the reference mechanism is understood.

## Preferred Layout Practice

- Use existing prefab/list patterns instead of rebuilding screens from scratch.
- For simple UI additions, clone local structure only after understanding parent layout.
- Keep text rendered by Laya text components, not baked into PNGs.
- Keep icon/button images independent when the UI references them independently.
