# Asset Path Rules

## Runtime Paths

In Laya runtime code, asset paths often omit `assets/`.

Example:

```ts
await Laya.loader.load("startupUI/login/Login.lh");
```

The project file is still:

```text
assets/startupUI/login/Login.lh
```

## Resource References

Laya UI files may use `res://...` UUID references. Do not replace these with raw paths unless the project already uses raw paths in that location.

## Meta Files

- Do not manually create `.meta` or UUID values.
- If replacing PNG content, keep existing `.meta`.
- If adding a new asset, let Laya generate `.meta`.
- For an existing IDE-generated `.meta`, maintain a known importer field such as `sizeGrid` only when the project contains a same-version generated sample and its schema is confirmed.
- In this project's confirmed LayaAir 3.3 texture metas, `sizeGrid` is stored under `importer` as `[top, right, bottom, left, repeatFlag]`. Values are source pixels and must match the asset's designed fixed margins.
- After changing importer settings, parse the `.meta`, reopen or reimport the asset in LayaAir IDE, and verify the field is preserved.

## Temporary Files

Temporary art files should not remain in the project after final integration.

Delete:

- review images
- source sheets
- contact sheets
- comparison sheets
- `_v4` or trial images

Keep:

- final integrated project assets
- project docs describing style and decisions
