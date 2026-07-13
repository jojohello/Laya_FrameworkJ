# Art Asset Audit

## Scope

Audited all PNG files under `assets/`.

Total PNG files at the time of the first audit: 41.

Contact sheets and comparison images are no longer kept in the project. Current policy is to keep only final integrated assets under `assets/`.

## Current Style Judgment

The project is being unified into the locked v4 western magic cute style. Intermediate review/source images have been removed; only final integration assets should remain.

## Style Groups

### Group A: Current Best Target Style

Examples:

- `assets/ui/battle/stage_node_*.png`
- `assets/ui/battle/stage_reward_chest.png`
- `assets/ui/battle/stage_route_flag.png`
- `assets/ui/common/imgs/btn-bg-yellow0.png`
- `assets/ui/common/imgs/btn-setting.png`
- `assets/ui/mainscene/imgs/icon-box.png`
- `assets/ui/mainscene/imgs/icon-cup.png`
- `assets/ui/mainscene/imgs/icon-world.png`

Characteristics:

- Q-version fantasy mobile game style.
- Thick outline, strong silhouette, glossy highlights.
- High saturation, warm gold accents, blue/teal shadow colors.
- Good small-size readability.

This should become the main UI icon style.

### Group B: Usable But Needs Unification

Examples:

- `assets/bigImg/battle_stage_map_forest.png`
- `assets/map/map001/map001.png`
- `assets/map/map002/floor.png`

Characteristics:

- Fantasy hand-painted backgrounds, but with different perspective, detail density, and palette.
- `battle_stage_map_forest.png` matches the stage progression use case.
- `map001.png` is brighter, softer, and more horizontal scene-focused.
- `map002/floor.png` is tile/config style rather than screen background style.

These should be unified by use case rather than forced into identical rendering.

### Group C: Legacy/Placeholder UI

Examples:

- `assets/startupUI/login/imgs/input-bg.png`
- `assets/startupUI/login/imgs/down.png`
- `assets/startupUI/login/imgs/up.png`
- `assets/startupUI/login/imgs/btn_bg_blue.png`
- `assets/startupUI/loading/imgs/blood_*.png`
- `assets/startupUI/startup/imgs/blood_*.png`
- `assets/ui/common/imgs/blood-*.png`

Characteristics:

- Lower polish, flatter gradients, less character.
- Some assets are pure functional bars/arrows and are acceptable temporarily.
- They do not match the richer fantasy UI standard.

These should be regenerated or redesigned when the corresponding UI screens are finalized.

### Group D: Special Branding/Loading

Example:

- `assets/bigImg/loading_bg.png`

Characteristics:

- Contains project logo and character illustration.
- Different purpose from gameplay UI.
- Not urgent to replace unless branding direction changes.

## Recommended Unification Standard

Use this as the art production target:

- 2D polished mobile game assets.
- Q-version fantasy adventure RPG.
- Thick clean outlines on icons and interactable UI.
- Glossy highlights, rounded bevels, clear material separation.
- Teal/cyan ambient shadows, warm gold/orange UI accents.
- Avoid baked text/numbers in images; render labels in Laya.
- Icons should be standalone transparent PNGs with enough padding.
- Backgrounds should avoid dense detail behind UI interaction points.
- Use temporary files only during review. After approval, overwrite the final integration filename and delete the temporary files.

## Regeneration Strategy

Do not regenerate every PNG blindly in one pass. Some files are functional slices, some are scene backgrounds, and some are temporary startup assets. A game-production-friendly approach is:

1. Define the target style from Group A.
2. Regenerate by feature screen, not by file list.
3. Keep filenames and dimensions only when required by existing UI layout.
4. Prefer no text/no numbers inside generated images.
5. Place each Laya-used icon as an independent PNG.
6. Let Laya generate `.meta` files. Do not hand-author `.meta`.

## Suggested Priority

1. Battle stage screen assets.
2. Common buttons/window panels.
3. Main scene feature icons.
4. Login/loading/startup functional UI.
5. Old map/background assets.
