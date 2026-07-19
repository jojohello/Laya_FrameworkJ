# ActorFsm 模块

## 设计选择

状态机采用“共享定义 + 实体运行态”。

- `BaseState` 实例可以全局共享。
- `StateMachine` 保存状态表，可以按实体类型共享。
- 当前状态名和状态数据保存在 `owner.fsmRuntime` 上。

这样不会像旧版每个怪物都创建一套 `StateMachine + State`，也避免共享状态实例时实体状态互相覆盖。

## 状态数据

不要在共享 `State` 实例字段里保存实体运行态，例如死亡开始时间、移动开始时间。

应放在：

```ts
owner.fsmRuntime.stateData
```

或者实体自己的业务字段上。

## 使用示例

```ts
const monsterFsm = new StateMachine<Monster>();
monsterFsm.registerState(new StateIdle());
monsterFsm.registerState(new StateMove());

monsterFsm.setState("Idle", monster);
monsterFsm.update(monster, curTime);
```

## 战斗角色状态

`CharacterActorFsm` 是战斗角色共享状态定义，当前提供稳定状态名：

| 状态 | 进入状态时的动画 | 退出方式 |
| --- | --- | --- |
| `Idle` | `idle` 循环 | 外部请求切换 |
| `Run` | `walk` 循环 | 外部请求切换；当前美术动作名仍为 walk |
| `Attack` | `attack` 单次 | 动画完成后自动回 `Idle` |

外部 AI、移动和战斗逻辑调用 `CharacterSceneObj.changeState(CharacterStateName.Xxx)`；不要直接调用 `playAnim()`。动画选择和 attack 完成后的状态回切由状态机负责。角色每帧驱动共享 FSM，但当前状态和状态数据仍保存在各自的 `fsmRuntime` 中；对象回池和复用时会重置。

角色业务调用优先使用实体语义接口：

```ts
unit.runTo(targetX, targetY);
unit.attack(skillId, targetId, targetX, targetY, skillLevel);
```

`runTo()` 使用实体 `speed` 属性移动，进入 Run，到达后自动进入 Idle；状态被攻击等行为打断时清除旧移动目标。`attack()` 复用 `SkillAgent`，只有技能实际释放成功才进入 Attack；连续攻击会强制重新进入 Attack 以重播动作。AI 通常不需要直接调用 `changeState()`，除非它表达的是没有移动或技能行为的纯状态控制。
