# LayaAir 3.3 runtime integration

## Resource model

`Laya.Animation` plays textures, not an arbitrary grid. Load `.atlas`, then assign its cached subtexture URLs to `animation.images`. In this project, `ResourceMgr` and `ResFrameAnimation` own loading and pooled instances; `CharacterAnimation.csv` defines actions; `CharacterSceneObj.playAnim()` exposes stable names; `CharacterTeamColorMaterial.setFrameTextures()` updates base/mask UVs together.

## Naming rule

Use URLs such as `character/1001/animation/idle_00.png` and `character/1001/animation/idle_mask_00.png`. Atlas keys and runtime URLs must include `.png`. LayaAir 3.3 `Loader.cacheRes()` determines type from the suffix; suffixless keys are not cached.

## Configuration

Maintain the owning character animation source/config, with only `actionName`, inclusive `startFrameIndex`, and `endFrameIndex` per action; export generated data through the normal pipeline. Playback is continuous through the selected range. Paths are relative to `assets/`; do not require `characterId` or `nextAction` in each action record.

## Lifecycle

- Verify every base subtexture is cached before playback.
- Use stable timer and event callback references.
- Clear the previous timer and COMPLETE listener on action changes.
- On recycle, stop, clear callbacks/state/material, hide, and remove the node.
- On disposal, additionally destroy the animation.
- Recover resources whose asynchronous load finishes after the SceneObj lifecycle changes.

## Diagnose

| Symptom | Cause and correction |
| --- | --- |
| `unsupported suffix` | Add `.png` to atlas keys and runtime URLs, then rebuild |
| null `sourceWidth` | A missing texture reached `animation.images`; verify atlas load and exact cached URLs |
| Static fallback only | Check exported `CharacterAnimation` rows and missing-subtexture log |
| Team color lags | Pair base/mask URLs and update both UVs on every frame |
| Fails after re-entry | Audit timers, listeners, materials, pooled nodes, references, and stale async tokens |

## Validate

Run TypeScript, text-format, and document validators. In LayaAir IDE verify idle, walk, attack-to-idle, both team colors, scale/foot anchor, exit/re-entry, and pooled reuse.
- Current project decision: `ResourceMgr` owns loading and pooled instances. The owning Entity update advances `ResFrameAnimation` with scaled scene delta time; the animation instance applies a new base/mask frame only when its frame index changes, while Laya continues normal per-frame rendering and transform submission. Minimal action metadata is `actionName`, inclusive `startFrameIndex`, and `endFrameIndex`; character identity comes from the owning resource. Playback is continuous through the range, with no `nextAction` in the minimal contract. Do not introduce a centralized player/renderer/system split until large-unit profiling proves it necessary.
