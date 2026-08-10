# Local Crowd Avoidance Design (implemented)

> This spec has been superseded by the implemented `LocalCrowdAvoidanceSystem`.
> The original "separation" idea (positional pair-wise pushing) was replaced during
> implementation by a movement-steering approach. This document now reflects the
> shipped design; the source of truth for live behavior is the code and the
> `src/logic/sceneObj/DESIGN.md` Run contract.

## Goal

Lightweight same-team steering for actively running battle characters without
global pair scanning, wall-clock timers, retained entity references, or
positional pushes of already-moved objects.

## Boundaries

- Only `CharacterSceneObj` movement produced by `Run` participates. Passive
  displacement such as charge, pull, knockback, teleport, or direct `setPos()`
  does not trigger steering.
- `BaseSceneObj.range` is the single logical circle radius; there is no separate
  `radius`. Spatial segmentation, skill/bullet collision, and local avoidance all
  read `range`; the character value comes from `Character.range`.
- The first version is enabled only by `BattleScene`; generic scenes pass the
  desired displacement through unchanged.
- The system stores only unit UIDs and a stable side; it resolves live objects
  immediately from `BaseScene` and never retains entity references.

## Data and update flow

1. `CharacterSceneObj.updateRunState()` computes its desired movement each frame.
2. `CharacterSceneObj` submits exactly one final displacement per frame through
   `scene.resolveCharacterMove(owner, desiredDx, desiredDy, out)`.
3. Plain `BaseScene` returns the desired movement unchanged.
4. `BattleScene` routes the call to `LocalCrowdAvoidanceSystem.resolveMove()`.
5. The system queries the same-team spatial index ahead of the owner, picks the
   nearest forward blocker within detection range, and returns a steered vector
   that keeps a positive forward component.
6. When no forward blocker is found, the desired displacement passes through and
   the stored state for that owner is forgotten.

## Steering rule and stability

- Only a live, same-team, same-object-type unit ahead of the owner (dot product
  of the offset and the desired direction is positive) is a candidate blocker.
- The lateral direction is a tangent relative to the actual front blocker; the
  stored `side` keeps clockwise/counter-clockwise selection stable per UID pair.
- Near a blocker, the forward component is never reversed, so a unit never backs
  away from its target or oscillates outside skill range.
- When the final frame already reaches the run stop distance, the last arrival
  segment is not laterally rewritten; the unit lands directly on the stop
  boundary.
- A per-owner state is forgotten when its blocker disappears or is released.

## Performance contract

- No all-character pair loop; candidate sets come only from the existing
  per-team `SpaceSegmentation` grid.
- No per-tick temporary entity arrays, timers, or random allocation; reusable
  sets and maps are used.
- Candidate objects are resolved through `getLiveObject()` immediately and never
  retained.

## Verification

- `CrowdAvoidanceRegressionCase`: verifies stable lateral steering around a
  forward blocker, forgetting released UIDs, pooled-reuse isolation, arrival
  within attack range, and that changing `range` changes the avoidance footprint.
- `CrowdAvoidanceArrivalRegressionCase`: verifies the Run state reaches the
  exact stop distance instead of orbiting forever, locking the shared
  target-edge cast-range contract.
