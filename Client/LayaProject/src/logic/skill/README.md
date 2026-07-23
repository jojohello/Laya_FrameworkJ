# Skill Module

## Goal

The skill system is a data-driven ability pipeline:

```txt
Skill
  -> Action script
      -> shared stateless Action instances
          -> Bullet / Damage / Buff / ...
          -> numeric config ids
```

`Skill.Action` keeps the compact string format used by the old project, for
example `0;Bullet;1001`. The string is parsed once when `SkillInfo` is built.
The resulting Action instances are config objects and are shared by all casts of
that skill level.

Action is a generic execution language, not only a skill feature. Skills,
bullets, buffs, plot playback and guide flows should all be able to trigger the
same stateless Action queue. Numeric containers are parameters of actions, not
actions themselves. For example, `0;Damage;1001` means "execute `DamageAction`
with damage config `1001`".

## Tables

Source CSV files live under:

```txt
E:\Laya_FrameworkJ_laya3\Config\csv
```

Current skill-related source tables:

- `Skill.csv`: skill identity and per-level runtime values.
- `Bullet.csv`: projectile movement, collision and `OnHitAction`.
- `Damage.csv`: damage numeric tuning.
- `Buff.csv`: buff lifetime, stack, attributes and lifecycle actions.

### Skill

Runtime lookup uses `SkillID + Level`, while `ID` is a composite row id kept for
config export and direct table indexing.

```txt
ID, SkillID, Level, Name, MaxLevel, SkillType, TargetType, CD, CostType, CostValue, Action, Desc
```

`Action` format:

```txt
delay;ActionName;param1;param2|delay;ActionName;param1
```

Current action examples:

- `0;Bullet;1001`: immediately create bullet `1001`.
- `200;Damage;1002`: after 200 ms, execute `DamageAction` with damage config
  `1002`.
- `0;Buff;3001;1;3000`: apply buff `3001`, stack `1`, duration override
  `3000` ms.

### Bullet

Defines projectile movement, collision and hit-result actions.

```txt
ID, MoveType, Speed, Range, PenetrateCount, FlyTime, CheckCollision, Resource, OnHitAction
```

`OnHitAction` is the only configured hit-result entry. Damage, healing, buffs
and debuffs should be actions with numeric config ids, not hardcoded fields on
the bullet table.

### Damage

Defines damage parameters for numeric tuning.

```txt
ID, BaseDamage, AttackRate, FormulaID, DamageType, ElementType
```

All HP-changing damage should enter the `DamageExecutor` path, normally through
`DamageAction`.

### Buff

Defines buff time, stacking, attribute modifiers and lifecycle actions.

```txt
ID, Duration, TickInterval, MaxStack, StackType, AttrAdd, AttrPercent, OnAddAction, OnTickAction, OnRemoveAction, Desc
```

Buff is a time container. It can execute actions on add, tick and remove, and it
will later gain explicit damage hooks for shield, reflect, reduction and life
steal effects.

## Runtime Pieces

- `SkillData.ts`: primitive config row data.
- `SkillInfo.ts`: runtime wrappers and parsing helpers.
- `SkillMgr.ts`: config access, `SkillID + Level` index and cached Info
  wrappers.
- `SkillRuntime.ts`: action/runtime context for combat entry points.
- `../action/BaseAction.ts`: generic action base class.
- `../action/DamageAction.ts`: executes damage by `Damage` id.
- `../action/BulletAction.ts`: creates a `BulletSceneObj` from `Bullet` config.
- `../action/BuffAction.ts`: applies a `Buff` to the current target.
- `../action/ActionFactory.ts`: parses Action strings once and creates shared
  stateless action instances by action name.

Damage execution is intentionally implemented as an executor path, not as one
object instance per damage event. `SkillMgr` caches Info wrappers, so
high-frequency hits reuse config wrappers instead of allocating them repeatedly.
Only effects with real runtime lifetime, such as buffs or dots, should create
per-target runtime instances.

## Test Config

The test skill keeps skill identity stable and varies level config:

```txt
Skill 1001 TestFireball
  -> Level 1: CD 1000, Action "0;Bullet;1001"
  -> Level 2: CD 800,  Action "0;Bullet;1002"
  -> Bullet 1001: OnHitAction "Damage;1001"
  -> Bullet 1002: OnHitAction "Damage;1002"
```

This means skill upgrades should call the same skill id with a higher
`skillLevel`; the runtime reads `Skill(SkillID, Level)` through a two-parameter
index and does not need a new skill identity.

Manual runtime check:

```ts
SkillDebugScenario.castTestFireball(scene, 1);
SkillDebugScenario.castTestFireball(scene, 2);
SkillDebugScenario.applyTestBurnBuff(scene);
```

## Buff Runtime

- `BuffAction` applies a buff id.
- `BuffAgent` is the creature-side owner of active buff instances.
- `BuffRuntime` represents one active buff instance on a target. It stores only
  `casterId`; the owning `BuffAgent` supplies target on each call.
- Attribute buffs modify `AttributeSet` through add/percent channels and
  remove their contribution on expire.
- Buff lifecycle actions are `OnAddAction`, `OnTickAction` and `OnRemoveAction`.

## Damage And Buff Design

Damage is handled by a single executor path:

```txt
DamageAction
  -> DamageExecutor
      -> fixed DamageContext stack
      -> caster BuffAgent.onBeforeDamage(ctx)
      -> target BuffAgent.onBeforeBeDamaged(ctx)
      -> apply HP damage
      -> target BuffAgent.onAfterBeDamaged(ctx)
      -> caster BuffAgent.onAfterDamage(ctx)
```

`DamageContext` is only a temporary data carrier for one damage flow. It should
not own business logic, allocate child objects, or be stored by Buffs. To avoid
high-frequency cache-list churn, `DamageExecutor` uses a fixed context stack by
depth index instead of pushing/popping pooled objects.

The generic event system should not participate in core damage calculation. Use
explicit Buff hooks for numeric mutation and interception. General events may be
emitted after the result for floating text, battle logs, UI, sound or analytics.

## Bullet Abstraction

`Bullet` is a delivery object composed by two connected policies today:

```txt
Bullet
  -> MovementPolicy
  -> CollisionPolicy
  -> OnHitAction
```

Movement controls how the bullet moves. Collision controls when and how targets
are collected. Hit results are delegated to `Bullet.OnHitAction`, so damage,
buff and other effects remain in the generic Action system.

The policy contracts live in `src/logic/bullet`. `BulletSceneObj` delegates
movement and collision to those policies and executes `OnHitAction` for valid
targets.

## Generic Action Integration

- Action base classes, parsing and factories live in `src/logic/action`.
- Skill is one caller of the generic action system.
- `DamageAction` is the main damage entry: `delay;Damage;damageId`.
- `Effect` and `TrueDamage` remain compatibility aliases.
- Bullet hit and Buff lifecycle effects use the same Action parser and executor.
- Runtime combat time is measured in seconds from `SceneTime`. Config fields with `Ms` suffix (skill delays/CD, Buff duration/tick, bullet `FlyTime`) remain authored in milliseconds and are converted once at the runtime boundary. Public cooldown-remaining values remain milliseconds.
- `SkillAgent` and `BuffAgent` do not cache their SceneObj owner. Creature entry points pass owner and `curTime` explicitly; delayed Skill records contain only primitive cast parameters and their planned execution time.
- `ActionContext` carries `casterId`, not a caster object. Actions resolve live
  entities through `Scene.getLiveObject()` only when they execute. Explicit
  cast-time snapshots are flattened primitive fields, never generic objects.
