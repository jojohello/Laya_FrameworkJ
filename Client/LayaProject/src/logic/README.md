# Logic 游戏逻辑

`logic` 是游戏主体分包。`LogicMain.ts` 是组合根，负责初始化配置、注册有统一生命周期的 Manager，并驱动 `ManagerHub.update()`。

## 模块组织

下一层目录通常就是一个完整模块。模块应通过 Manager、Agent、Executor、Factory 或其他明确入口提供能力，不要求每个目录都拥有相同文件模板。

主要服务入口：

| 模块 | 公开入口或核心能力 |
|------|--------------------|
| `config` | `ConfigMgr` |
| `resource` | `ResourceMgr` |
| `scene` | `SceneMgr`、`BaseScene`、`BattleScene` |
| `sceneObj` | `BaseSceneObj` 及对象类型 |
| `ui` | `UIManager` |
| `mainScene` | `MainSceneView` loads the compact `ui/mainscene/playerProfile.lh` HUD and binds player/Wallet/function-open state |
| `skill` | `SkillMgr`、`SkillAgent` |
| `item` | `ItemMgr`、`BagMgr` |
| `ai` | `AIAgent`、`AIScheduler` |
| `action` | `ActionFactory`、Action 执行体系 |
| `guide` | `GuideMgr`、双端条件、异步引导流程与服务器进度同步 |
| `damage` | `DamageExecutor` |
| `map` | `SceneMapFactory` |
| `battleScene` | `BattleStageScene`、`BattleScene`、`BattleMainViewController`；战斗内 HUD 的暂停与返回流程 |

ManagerHub 当前注册位置是 [LogicMain.ts](LogicMain.ts)。新增 Manager 时先确认它确实需要全局生命周期，再在组合根注册。
