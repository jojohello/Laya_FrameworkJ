# Scene Transition Slow-Loading Design

## Goal

Do not treat a slow but progressing resource download as a failed scene transition. Replace the current 15-second hard transition deadline with a soft warning, while preserving immediate failure for explicit resource, parsing, shader, UI, and lifecycle errors.

## Current problem

- `StartMain` configures `Laya.loader.retryNum = 20` and `retryDelay = 1000`.
- `SceneMgr` currently stops waiting after 15 seconds and rolls back the target scene.
- A slow request can therefore be rejected before Loader finishes its configured retries.
- LayaAir resolves failed `load()` entries as `null`; `BattleScene` currently relies mainly on `catch`, so a completed load containing failed required resources can escape the intended transition-error path.
- SceneMgr displays phase constants rather than the actual battle-resource loading progress.

## Transition outcome contract

A transition has four outcomes:

- `Ready`: every required Scene and UI participant is ready.
- `Failed`: a participant reports an explicit error or a required resource resolves as missing.
- `Cancelled`: the active transition is superseded or explicitly cancelled.
- `Waiting`: work is still active, regardless of total elapsed time.

Elapsed time alone never changes `Waiting` to `Failed`.

## Slow-loading policy

- At 15 seconds, emit one warning and change the Loading text to indicate that the network is slow and loading is continuing.
- Do not close Loading, destroy the target Scene, or roll back solely because the warning threshold was crossed.
- Keep using the scene-switch token/current-scene checks so late async work cannot mutate a newer scene lifecycle.
- Explicit `transitionError` remains terminal and rolls back through the existing serialized SceneMgr path.

The 15-second value is a presentation/observability threshold, not a correctness deadline.

## Required-resource validation

`BattleScene` must retain the result of `Laya.loader.load(paths, ..., onProgress)` and verify that every required entry is non-null before creating units. A null entry produces a `transitionError` that identifies the failed resource path.

Shader registration and post-load lookup remain separate required checks. An exception, a null required resource, a shader failure, or an incomplete required UI binding is an explicit failure; slow progress is not.

## Progress ownership

`BattleScene` owns battle-resource progress because it knows the required resource set. SceneMgr combines scene preparation progress with its outer switch phases and passes the resulting value and text to the existing Loading service.

Progress must be monotonic within one transition. A warning may change the text but must not fabricate completion or reset progress.

## Retry scope

This batch retains LayaAir's configured loader retry count and delay. It does not add a second retry loop around `Laya.loader.load()`.

A later ResourceMgr task may replace the fixed retry interval with centralized transient-error classification and exponential backoff with jitter. That change must cover all resource callers consistently rather than only BattleScene.

## User escape path

The runtime must eventually expose “继续等待 / 重试 / 返回” after a slow-load warning. The current Loading scene has no button contract, so visual controls are a separate UI batch requiring LayaAir IDE resource work and interaction acceptance.

This batch removes the incorrect automatic rollback and keeps explicit failure rollback. It must not introduce an unstyled runtime-created button or a hidden Stage-click shortcut.

## Verification

- A Laya-independent transition-wait regression proves that crossing 15 seconds warns once but remains `Waiting`.
- The same regression proves explicit error and cancellation remain terminal.
- Battle resource regression or focused static checks prove failed `load()` entries are inspected instead of relying only on exceptions.
- TypeScript, text-format, and document-system checks pass.
- In LayaAir IDE, normal battle entry still closes Loading and enters `Running`.
- With a controlled delayed readiness, crossing 15 seconds keeps Loading visible and does not return to the stage scene; releasing the delay completes the same transition.

