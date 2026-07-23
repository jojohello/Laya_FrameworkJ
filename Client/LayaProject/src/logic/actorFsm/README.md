# ActorFsm 模块

## 设计选择

状态机采用“共享定义 + 实体当前状态名”。

- `BaseState` 实例可以全局共享。
- `StateMachine` 保存状态表，可以按实体类型共享。
- 当前状态名保存在 `owner.fsmStateName` 上。

这样不会像旧版每个怪物都创建一套 `StateMachine + State`，也避免共享状态实例时实体状态互相覆盖。

## 状态数据

共享 `State` 实例不得保存实体运行态。状态确实需要移动目标、开始时间等数据时，使用实体上的明确业务字段或专用模块；不使用通用 `Map<string, any>` 隐藏状态数据。

## 使用示例

```ts
const monsterFsm = new StateMachine<Monster>();
monsterFsm.registerState(new StateIdle());
monsterFsm.registerState(new StateMove());

monsterFsm.setState("Idle", monster, curTime);
monsterFsm.update(monster, curTime);
```

## 战斗角色状态

`CharacterActorFsm` 是战斗角色共享状态定义，当前提供稳定状态名：

| 状态 | 进入状态时的动画 | 退出方式 |
| --- | --- | --- |
| `Idle` | `idle` 循环 | 外部请求切换 |
| `Run` | `walk` 循环 | 外部请求切换；当前美术动作名仍为 walk |
| `Attack` | 不写死动作；由技能 `AnimationAction` 选择 | 技能计划结束时间到达后回 `Idle` |

外部 AI、移动和战斗逻辑调用 `CharacterSceneObj.changeState(CharacterStateName.Xxx, curTime)`；不要直接调用 `playAnim()`。状态进入、退出及更新都使用调用方显式传入的场景时间，不允许状态自行读取真实时间。动画选择和 attack 完成后的状态回切由状态机负责。角色共享 FSM 定义，当前状态名保存在各自的 `fsmStateName` 中；对象回池和复用时会重置。

角色业务调用优先使用实体语义接口：

```ts
unit.runTo(targetX, targetY, curTime);
unit.attack(skillId, curTime, targetId, targetX, targetY, skillLevel);
```

`runTo()` 使用实体 `speed` 属性移动，进入 Run，到达后自动进入 Idle；状态被攻击等行为打断时清除旧移动目标。`attack()` 复用 `SkillAgent`，只有技能实际释放成功才进入 Attack。技能动作名来自 Action 配置，状态机不判断 `"attack"`，也不监听动画完成回调；`SkillAgent` 在到期 Action 执行后按计划结束时间退出 Attack。AI 通常不需要直接调用 `changeState()`，除非它表达的是没有移动或技能行为的纯状态控制。
