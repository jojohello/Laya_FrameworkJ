# BehaviorTree 模块

## 设计选择

当前先迁移旧项目 boolean 行为树，不使用三态。

- `true`: 当前节点本次 tick 成功。
- `false`: 当前节点本次 tick 失败。
- 持续行为的状态保存在 owner/entity 上，不保存在行为树节点上。

## 共享树模式

行为树节点通过 `execute(owner, curTime)` 接收实体参数。节点自身不保存具体实体的运行状态，因此同类型实体可以共享同一棵树：

```ts
monsterTree.execute(monsterA, curTime);
monsterTree.execute(monsterB, curTime);
```

这样可以减少 iOS 等内存敏感平台上的重复节点实例。

## 节点

- `BSelectorNode`: 子节点任一成功则成功。
- `BSequenceNode`: 子节点全部成功才成功。
- `BParallelNode`: 执行所有子节点，固定返回成功。
- `BConditionNode`: 函数式条件叶子节点。
- `BActionNode`: 函数式行为叶子节点。

## AI 调度

`AIAgent` 是共享 AI 定义，内部持有共享行为树和思考间隔。每个实体只在 `owner.aiRuntime` 上保存：

- `stopped`
- `nextThinkTime`

思考时间与 `SceneTime` 一致使用秒；当前代码常量为 `0.1` 秒，不从配置读取。

`AIScheduler` 负责把 AI 分组到不同逻辑更新。调度项只保存实体 ID 和共享的无状态 Agent，owner 由 Scene 在执行时解析：

```ts
const scheduler = new AIScheduler({ groupCount: 3 });
scheduler.register(monster.uid, monsterAgent);
scheduler.update(curTime, tick, sceneResolver);
```

`sceneResolver` 实现 `getAIOwner(id)`，内部通过 Scene 的 live 实体查询取得本次 owner；Scheduler 不缓存 owner。`groupCount=3` 时每次逻辑更新只 tick 一组，30 tick/秒下每个实体约每 0.1 秒被调度一次。`AIAgent` 仍按自己的 `thinkInterval` 做精确间隔判断。当前 `BattleScene` 已使用该三组调度，不再由每个 Character 逐逻辑帧直接执行 AI。

也可以配置确定性的单次逻辑更新数量预算：

```ts
scheduler.setLogicUpdateBudget(50);
```

含义是单次逻辑更新最多处理 50 个 AI。预算不够时保留当前组，下次逻辑更新继续；不得使用 `performance.now()` 或墙钟耗时决定哪些 AI 获得 gameplay 更新。

## 简单战斗 AI

`SimpleCombatTree` 和 `SimpleCombatAIAgent` 都是模块级单例定义。所有使用该模式的角色共享同一棵树和同一个 Agent；每次执行将 `CharacterSceneObj` 作为参数传入。Entity 独立保存 `targetUid`、`selectedSkillId`、`selectedSkillRange`，共享节点不得保存这些数据。

```text
SimpleCombatBehaviorNode (Selector)
├─ IsExecutingSkillNode
├─ Sequence
│  ├─ EnsureNearestTargetNode
│  └─ Selector
│     ├─ TryUseSkillNode (Sequence)
│     │  ├─ SelectReadySkillNode
│     │  ├─ IsSelectedSkillInRangeNode
│     │  └─ CastSelectedSkillNode
│     └─ ApproachTargetNode
└─ EnterIdleNode
```

可复用条件节点包括 `IsRunningNode`、`HasReachedTargetNode`、`IsExecutingSkillNode`、`IsIdleNode`。技能按 `Character.skillIds` 顺序选择，CD 和 `CastRange` 来自 Skill 表；普通攻击也是技能。移动停止容差是代码常量 10 像素，不建立 AI JSON 或模板配置。
