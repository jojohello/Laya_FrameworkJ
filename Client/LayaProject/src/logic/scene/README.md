# Scene 模块

`SceneMgr` 负责串行切换 Scene、缓存空的 Scene 类实例、驱动关联 UI，并把每个 Laya 帧的未缩放 delta 传给当前 `BaseScene`。

需要覆盖异步地图和 gameplay 资源准备的入口使用：

```ts
await SceneMgr.instance.switchSceneWithLoading(
    SceneType.BattleScene,
    { stageId, battleId },
    "战斗加载中"
);
```

`switchSceneWithLoading()` 不创建 Loading UI。它向首包 `LoadingMgr` 提交本次场景切换的 `onProcess` 和 `isEnd` 回调；LoadingMgr 只负责显示、逐帧刷新和关闭。目标 Scene 与目标 UI Controller 都实现 `TransitionReady` 时，SceneMgr 同时等待两者的 `isTransitionReady`；只有地图/玩法资源就绪且主界面已显示并完成控件绑定后，场景模块的 `isEnd` 才返回 `true`。普通 Scene 默认以 `isReady` 作为过场完成条件；BattleScene 还会等待角色纹理、队伍色 Shader 和初始战斗单位创建。任一参与者报告 `transitionError` 或 15 秒内未就绪时，SceneMgr 退出半初始化场景并回退到上一场景，随后结束本次 Loading。

`BaseScene` 提供两种逻辑调度模式：

- `SceneTimeMode.Realtime`：按 Laya 帧使用真实经过时间推进。
- `SceneTimeMode.FixedTick`：默认按 30 tick/秒推进，支持积压追赶。

Scene 子类通过以下展开参数接口实现逻辑与表现：

```ts
logicUpdate(logicDt, curTime, tick)
renderUpdate(renderDt, curTime, tick, interpolationAlpha)
```

暂停、倍速、后台恢复、追帧和渲染跳过由 `BaseScene`/`SceneTime` 集中处理。下层 gameplay 只消费最终逻辑时间。详细约束见 [DESIGN.md](DESIGN.md)。

跨帧系统保存实体 `uid`，实际计算前调用 `BaseScene.getLiveObject(uid)` 解析当前生命周期对象。`getObject(uid)` 用于需要观察 release 对象的场景内部流程，普通 gameplay 不应把返回对象写入 Runtime 或延迟队列。

可重复的纯调度验证通过以下命令运行：

```powershell
powershell -ExecutionPolicy Bypass -File tools/tests/validate-scene-time.ps1
```

当前覆盖 Realtime 后台补时与 2×、FixedTick 单帧 1/3/4/5 次更新、5 次上限、积压不丢弃、暂停、后台忽略、跳过渲染和累计 `renderDt`。

BattleScene 已在 LayaAir IDE 完成 1×/2×、暂停/恢复和连续三次“进入战斗 → 返回征战 → 再次进入”运行验证。暂停期间逻辑与动画冻结，恢复后从原状态继续；缓存恢复后的 Scene 时间、对象、地图、UI 和战斗状态重新初始化，无重复角色、事件或旧子弹残留。
