# Logic 游戏逻辑

`logic` 是游戏主体分包。`LogicMain.ts` 是组合根，负责初始化配置、注册有统一生命周期的 Manager，并驱动 `ManagerHub.update()`。

## 模块组织

下一层目录通常就是一个完整模块。模块应通过 Manager、Agent、Executor、Factory 或其他明确入口提供能力，不要求每个目录都拥有相同文件模板。

主要服务入口：

| 模块 | 公开入口或核心能力 |
|------|--------------------|
| `config` | `ConfigMgr` |
| `resource` | `ResourceMgr` |
| `scene` | `SceneMgr`、`BaseScene`；异步场景切换串行执行，Realtime/30Hz FixedTick 在 Scene 边界形成统一逻辑时间，逻辑与渲染分离 |
| `sceneObj` | `BaseSceneObj` 及对象类型 |
| `ui` | `UIManager` |
| `mainScene` | `MainSceneView` loads the compact `ui/mainscene/playerProfile.lh` HUD and binds player, authoritative Wallet currencies (`1001` Gold and `1004` Crystal), and function-open state |
| `skill` | `SkillMgr`、`SkillAgent` |
| `item` | `ItemMgr`、`BagMgr` |
| `ai` | `AIAgent`、仅保存实体 ID 的 `AIScheduler`；BattleScene 使用三组确定性摊帧 |
| `action` | `ActionFactory`、Action 执行体系 |
| `guide` | `GuideMgr`、双端条件、异步引导流程与服务器进度同步 |
| `damage` | `DamageExecutor` |
| `map` | `SceneMapFactory` |
| `battleScene` | `BattleStageScene`、`BattleScene`、`BattleSettlementMgr`、`BattleMainViewController`；战斗内 HUD 的 1×/2×倍速、暂停与返回流程；服务端战斗会话、结算回包与胜利奖励展示 |

ManagerHub 当前注册位置是 [LogicMain.ts](LogicMain.ts)。新增 Manager 时先确认它确实需要全局生命周期，再在组合根注册。

Action 类型由各自的 Action 文件在模块末尾注册到 `ActionRegistry`。`ActionFactory` 只负责脚本解析、排序和统一创建，不维护具体子类的分支；新增 Action 时在自身文件注册类型即可。多个配置别名可以注册到同一个 Action 构造器。

BattleScene 的胜利/失败结算生命周期已通过 LayaAir IDE 运行验收：队伍消灭或 `reportBattleResult()` 只进入一次结果状态，结果层正确拦截战斗输入，确认后进入 `Exiting` 并由 `SceneMgr` 串行返回征战场景。
