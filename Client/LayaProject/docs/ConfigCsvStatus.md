# Config CSV Status

配置唯一源位于仓库根目录的 `Config/csv`。

The CSV `UsedSize` row marks export ownership:

- `cs`: exported to both client and server.
- `c`: client-only display or resource data.
- `s`: server-only data.

## Current Tables

- `MainNav.csv`: main-shell bottom navigation label, icon, order, function-open
  gate and stable route key. `routeArgs` is a JSON array string at runtime.
- `BattleStage.csv`: battle-stage name, normal/Boss presentation, battle ID and
  enterability used by `BattleStageScene`.
- `Skill.csv`: skill identity and level runtime values. Server needs `ID`,
  `SkillID`, `Level`, `MaxLevel`, `SkillType`, `TargetType`, `CD`,
  `CostType`, `CostValue` and `Action`. Client-only fields are `Name` and
  `Desc`.
- `Bullet.csv`: projectile movement, collision and `OnHitAction` gameplay
  fields. Server needs movement/collision/action fields. `Resource` is
  client-only.
- `Damage.csv`: numeric damage tuning. Server needs all damage formula fields.
- `Buff.csv`: buff lifetime, stack, attributes and lifecycle actions.
  `OnAddAction`, `OnTickAction` and `OnRemoveAction` are shared action scripts.
- `Item.csv`: item identity and basic use config. Server needs `ID`, `Type`,
  `Quality`, `MaxStack` and `UseAction`. `Name` and `Desc` are client-only.
- `SceneObjConfig.csv`: scene object base attributes. `CreatureSceneObj` reads
  this table on init and applies `hp`, `speed`, `attack` and `defense`.
- `Character.csv`: battle character display and behavior references, including
  soldier type, base scene-object ID, model and team-mask paths, display scale,
  skill IDs and AI template ID.
- `SceneType.csv`: scene class and map config.

## Skill Table Direction

- Action is a generic execution language shared by skill, bullet, buff, plot and
  guide systems.
- `DamageAction` uses a damage numeric group id, for example `0;Damage;1001`.
- Numeric groups are parameters of actions. They are not modeled as standalone
  Action types.
- `Bullet.OnHitAction` is the hit-result entry. Current test bullets use
  `Damage;1001` and `Damage;1002`.
- Buff uses lifecycle action fields instead of a separate effect bridge table.

## Removed Or Renamed Tables

- `Test.csv` was removed. It was a standalone test table and not read by client
  code.
- `ItemConfig.csv` was renamed to `Item.csv`.
- `SkillBase.csv` and `SkillLevel.csv` were merged into `Skill.csv`.
- `SkillBuff.csv` was renamed to `Buff.csv`.
- `SkillBullet.csv` was renamed to `Bullet.csv`.
- `SkillEffectDamage.csv` was renamed to `Damage.csv`.
- `SkillEffectGroup.csv` was removed. Action queues now provide composition.
- `SkillEffectBuff.csv` was removed. `BuffAction` applies `Buff` directly.

## Verification

- Client export was run after the latest table cleanup.
- Export result: `Success: 7`, `Failed: 0`.
