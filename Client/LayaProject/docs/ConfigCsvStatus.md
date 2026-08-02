# Config CSV Status

配置唯一源位于仓库根目录的 `Config/csv`。

The CSV `UsedSize` row marks export ownership:

- `cs`: exported to both client and server.
- `c`: client-only display or resource data.
- `s`: server-only data.

## Current Tables

- `MainNav.csv`: main-shell bottom navigation label, icon, order, function-open
  gate and stable route key. `routeArgs` is a JSON array string at runtime.
- `UITextStyle.csv`: client-only semantic text styles used while assembling
  `.ls/.lh` screens and by runtime-created/stateful text through `UITextStyle`.
  It includes font, size, color, bold, stroke pixels, stroke color and alignment.
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
- `Character.csv`: all creature base attributes, display and behavior,
  including soldier type, `hp`, `speed`, unified `attack`, physical/magic
  defense, display scale and skill IDs. `CreatureSceneObj` reads this table
  directly; towers, players and formal monsters use their own Character IDs.
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
- `SceneObjConfig.csv` was merged into `Character.csv`; all creature base
  attributes now have one authoritative row per Character ID.

## Verification

- Client export was run after the Character attribute merge: `Success: 13`,
  `Failed: 0`.
- Server export generated all 8 shared tables; 5 client-only tables were
  intentionally skipped.
- LayaAir IDE completed an initial run with the updated client configuration.
