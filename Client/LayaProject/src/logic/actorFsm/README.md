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
