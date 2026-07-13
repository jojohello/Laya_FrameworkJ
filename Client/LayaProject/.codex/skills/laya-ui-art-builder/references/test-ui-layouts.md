# Test UI Layouts

Use this reference when creating simple LayaAir `.ls` scenes or `.lh` prefabs for verification and examples.

## Directory Convention

- Use `assets/testAndSample/` for verification scenes and example scenes.
- Use `assets/testAndSample/editorResources/` for editor-only `.ls` scenes and their starter `.ts` scripts.
- Do not assume the directory is excluded from builds unless `settings/BuildSettings.json` or build output confirms it.

## Creation Workflow

1. Search for a nearby existing `.ls` or `.lh` file and follow its serialized structure.
2. Decide whether the artifact is a scene or prefab:
   - `.ls`: runnable verification scene.
   - `.lh`: reusable UI panel or prefab.
3. Keep the visual structure small: root container, title/status text, one or two buttons, optional log area.
4. Add a Runtime script only when the scene needs to start logic. Keep the script focused on bootstrapping the test flow.
5. Avoid manual `.meta` creation; let Laya IDE manage metadata.
6. Validate JSON parsing and check that runtime paths do not include an `assets/` prefix.

## Minimal Test Scene Shape

A useful test scene usually contains:

- Root scene/container with a clear name.
- A compact status text node.
- A primary button to start the validation.
- Optional secondary button to reset or return.
- Optional log text area for runtime state.

## Runtime Script Guidelines

- Keep scripts under the same editorResources area when they only drive editor/test scenes.
- Use the script to call project managers or debug scenario entry points; avoid embedding production logic in the test scene.
- If the script enters a real game flow, prefer calling the same public API production code will use.

## Laya 3 Notes

- Prefer new UI node types with `G` prefixes when authoring serialized UI nodes directly.
- Do not use `new Laya.TextInput()` in scripts; use `new Laya.Input()`.
- Do not load UI paths with an `assets/` prefix.
- Preserve `res://` references and runtime links copied from existing files.
