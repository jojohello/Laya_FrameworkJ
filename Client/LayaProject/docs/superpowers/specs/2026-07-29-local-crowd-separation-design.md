# Local Crowd Separation Design

## Goal

Add lightweight same-team crowd separation for actively running battle characters without global pair scanning, wall-clock timers, or retained entity references.

## Boundaries

- Only `CharacterSceneObj` movement produced by `Run` participates. Passive displacement such as charge, pull, knockback, teleport, or direct `setPos()` does not mark a participant and does not trigger separation.
- `BaseSceneObj.radius` is the generic logical body radius. `Character.radius` may override it; an omitted or invalid character value defaults to 25 logical pixels and is clamped to 48. It is independent from `BaseSceneObj.range`, which remains the skill/bullet hit-candidate radius.
- The first version is enabled only by `BattleScene`; generic scenes do not pay a crowd-separation cost.
- The separation system stores only unit IDs and resolves live objects immediately from `BaseScene`.

## Data and update flow

1. `BaseScene` clears its active-move ID set and max active-move distance at the beginning of every logic tick.
2. `CharacterSceneObj.onLogicUpdate()` resets its per-tick active-move flag before the FSM updates.
3. `CharacterSceneObj.updateRunState()` marks the flag and records its UID and actual displacement in its scene only after a successful active `Run` position change.
4. After `BaseScene.logicUpdate()` finishes all character movement, `BattleScene` invokes `LocalCrowdSeparationSystem.resolve(scene)`.
5. The system iterates only the active IDs. For each live running character, it queries its own team spatial index with `ownRadius + configuredMaxRadius + maxActiveMoveDistance` and resolves only candidates with a larger UID. This yields each pair once and prevents global O(n²) scanning.
6. The system applies a bounded positional correction and refreshes the affected objects' spatial hashes immediately.

## Separation rule and stability

- A pair is eligible only when both units are live, same-team `CharacterSceneObj`s and their center distance is below the sum of their separation radii.
- The correction is along the center-to-center normal. For coincident centers, a deterministic normal derives from the ordered UID pair; it never uses random values.
- Each pair resolves only a fraction of the overlap, and each unit has a strict maximum correction per logic tick. This makes correction continuous rather than an overshooting teleport.
- A small overlap dead zone suppresses sub-pixel corrections. The system never adds a reverse velocity or changes `runTo()` targets, base speed, FSM state, AI state, or skill state. Therefore normal movement resumes toward the same target and cannot alternate between opposing velocity impulses.
- Both active and inactive characters can receive a bounded positional correction, but only active characters initiate pair evaluation. This prevents a running formation from being blocked by stationary allies while keeping passive displacement outside the initiating set.

## Performance contract

- No all-character pair loop; candidate sets come only from the existing per-team `SpaceSegmentation` grid.
- No per-tick temporary entity arrays, timers, or random allocation. Reusable UID sets and scalar math are used.
- Pair ordering is deterministic by UID. Candidate objects are resolved through `getLiveObject()` immediately and never retained.
- Character radius is clamped to a documented upper bound so the local query radius remains bounded. The default 25-pixel radius makes the desired same-team center spacing 50 pixels.

## Verification

- Add a headless regression that creates dense same-team runners, verifies separation reduces overlap without changing their run target/state, and asserts the system only records active run movement.
- Add passive-displacement coverage: direct position change without `Run` leaves the active-move set empty and no separation is initiated.
- Add pooled-reuse coverage: release a participant, reuse the instance under a new UID, and verify no prior UID is resolved or moved.
- Run TypeScript, text-format, and document-system validation; then use the IDE battle scene to observe a dense formation for visible separation without rapid back-and-forth jitter.
