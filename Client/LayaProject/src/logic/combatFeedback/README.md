# Combat feedback

`CombatFeedbackMgr` is the unified world-space text entry for battle results.

Damage is emitted by `DamageExecutor` after HP is applied. `CreatureSceneObj.heal` emits only the effective recovery. Other systems can call `showStatus(target, text, curTime, immune)` for status and immune results.

`BattleScene` drives `CombatFeedbackMgr.update(scene, curTime)` with battle time. The manager exposes `setEnabled`, `setMaxVisible`, and `setMaxQueued` for performance controls.
