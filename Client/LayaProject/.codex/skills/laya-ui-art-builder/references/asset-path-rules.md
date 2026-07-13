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

- Do not manually create `.meta`.
- If replacing PNG content, keep existing `.meta`.
- If adding a new asset, let Laya generate `.meta`.

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
