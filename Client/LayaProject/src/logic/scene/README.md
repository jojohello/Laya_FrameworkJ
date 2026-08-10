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

`switchSceneWithLoading()` 不创建 Loading UI。它向首包 `LoadingMgr` 提交本次场景切换的 `onProcess` 和 `isEnd` 回调；LoadingMgr 只负责显示、逐帧刷新和关闭。目标 Scene 与目标 UI Controller 都实现 `TransitionReady` 时，SceneMgr 同时等待两者的 `isTransitionReady`；只有地图/玩法资源就绪且主界面已显示并完成控件绑定后，场景模块的 `isEnd` 才返回 `true`。普通 Scene 默认以 `isReady` 作为过场完成条件；BattleScene 还会等待角色纹理、队伍色 Shader 和初始战斗单位创建。准备超过 15 秒只记录一次慢加载告警并继续等待；只有参与者报告 `transitionError` 或场景生命周期失效时，SceneMgr 才退出半初始化场景并回退到上一场景，随后结束本次 Loading。

`BaseScene` 提供两种逻辑调度模式：

- `SceneTimeMode.Realtime`：按 Laya 帧使用真实经过时间推进。
- `SceneTimeMode.FixedTick`：默认按 30 tick/秒推进，支持积压追赶。

Scene 子类通过以下展开参数接口实现逻辑与表现：

```ts
logicUpdate(logicDt, curTime, tick)
renderUpdate(renderDt, curTime, tick, interpolationAlpha)
```

暂停、倍速、后台恢复、追帧和渲染跳过由 `SceneMgr`/`BaseScene`/`SceneTime` 集中处理。舞台不可见时 Scene 更新被完全阻断；FixedTick 恢复后从原 tick 继续，玩家原有的主动暂停状态不会被前后台切换覆盖。下层 gameplay 只消费最终逻辑时间。详细约束见 [DESIGN.md](DESIGN.md)。

跨帧系统保存实体 `uid`，实际计算前调用 `BaseScene.getLiveObject(uid)` 解析当前生命周期对象。`getObject(uid)` 用于需要观察 release 对象的场景内部流程，普通 gameplay 不应把返回对象写入 Runtime 或延迟队列。

`SceneCamera2D` 默认使用固定模式，Scene 通过 `configureCamera()` 显式选择镜头策略：

```ts
protected configureCamera(camera: SceneCamera2D): void {
    camera.enableDrag({ horizontal: false, vertical: true });
}
```

相机内部 `x/y` 表示视口左上角；面向世界点时使用 `lookAt()`，持续跟随实体时使用只保存 UID 的 `setTarget()`：

```ts
scene.camera?.lookAt(worldX, worldY);
scene.camera?.setTarget(characterUid, { offsetY: -80 });
scene.camera?.clearTarget();
scene.camera?.setFixed();
```

固定、拖拽和跟随模式互斥。`BattleScene` 当前保持固定镜头，`BattleStageScene` 显式启用仅纵向拖拽。

场景拖拽只从场景节点或 Stage 空白处开始，不接管 UI/弹窗输入。指针移动不足 12 像素时保留点击语义，超过阈值后才移动地图；因此征战节点可以同时支持“单击进入战斗”和“从节点开始拖动地图”。Stage 尺寸变化会刷新地图边界，场景退出时会移除拖拽和 resize 监听。内部只允许原生 Camera2D 或场景根节点中的一个承担位移，避免视口被重复偏移。

可重复的纯调度验证通过以下命令运行：

```powershell
powershell -ExecutionPolicy Bypass -File tools/tests/validate-scene-time.ps1
powershell -ExecutionPolicy Bypass -File tools/tests/validate-scene-camera-state.ps1
```

Camera 回归覆盖 `lookAt` 居中与边界裁剪、UID 跟随计算、模式切换、12 像素拖拽阈值、纵向轴锁定，以及根节点/原生 Camera2D 单一位移后端。LayaAir IDE 的运行验收还应检查：

1. `BattleScene` 拖拽不移动地图，按钮输入正常。
2. `BattleStageScene` 只允许纵向拖拽，上下边界正确。
3. 单击关卡节点进入战斗；从节点开始拖动只移动地图。
4. 从 UI 开始拖动不移动地图，普通 UI 点击仍生效。
5. 连续三次执行“征战 → 战斗 → 征战”，无旧视口、重复输入或事件残留。
6. 缩放预览窗口后边界随 Stage 尺寸更新，不露出地图外空白。

Scene 时间回归覆盖 Realtime 后台补时与 2×、FixedTick 单帧 1/3/4/5 次更新、5 次上限、积压不丢弃、暂停、后台忽略、跳过渲染和累计 `renderDt`。

BattleScene 已在 LayaAir IDE 完成 1×/2×、暂停/恢复和连续三次“进入战斗 → 返回征战 → 再次进入”运行验证。暂停期间逻辑与动画冻结，恢复后从原状态继续；缓存恢复后的 Scene 时间、对象、地图、UI 和战斗状态重新初始化，无重复角色、事件或旧子弹残留。
