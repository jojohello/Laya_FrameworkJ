# Scene 时间设计

本文件作用于 `src/logic/scene/`，并约束所有依赖 Scene 逻辑时间的 gameplay 模块，包括 SceneObj、AI、Skill、Action、Buff、Bullet 和战斗动画。

## 时间域

项目明确区分以下时间域，不允许通过含糊的 `realTime`、`now` 或默认取时混用：

- **逻辑时间**：由当前 Scene 调度器形成，是 gameplay 唯一可用的权威时间。运行时单位统一为秒。
- **墙钟时间**：只用于网络时间戳、真实超时、SDK、登录、资源缓存淘汰、非 gameplay 的 UI 输入去重和外层后台时长测量，不参与可回放 gameplay 计算。
- **渲染时间**：只用于表现推进和插值，不反向决定 gameplay 结果。
- **性能采样时间**：只用于耗时统计和预算监控，不参与业务条件。

`Laya.timer.unscaledDelta` 只允许在最外层 Laya 帧入口读取一次。`Date.now()`、`performance.now()` 和 `Laya.timer` 不得出现在 SceneObj、AI、Skill、Action、Buff、Bullet、战斗 FSM 或动画完成判断中。确需墙钟或性能采样的代码必须用 `wallClock`、`monotonic` 或 `performance` 等能表达时间域的名称，并留在对应的外层服务边界。

## Scene 调度边界

`BaseScene.update(unscaledDelta, backgroundElapsed)` 是每个 Laya 帧的唯一 Scene 入口。它根据 Scene 时间模式形成参数并调用：

```ts
logicUpdate(logicDt, curTime, tick)
renderUpdate(renderDt, curTime, tick, interpolationAlpha)
```

参数必须展开传递，不使用隐藏字段的 Context 对象。暂停、倍速、后台策略、固定步长、追帧上限和渲染跳过只在 Scene/SceneTime 调度层决定；下层不得读取 `SceneTimeMode` 或重新推导这些参数。

- `logicDt`、`curTime`、`renderDt` 的运行时单位均为秒。
- `tick` 在 FixedTick 中是权威逻辑帧序号，在 Realtime 中只是逻辑更新序号。普通持续时间逻辑统一比较 `curTime`，不因模式不同切换为 tick 计算。
- 配置表中的毫秒值必须使用 `Ms` 后缀或已有明确毫秒语义，并在 Info/Action 解析或显式 `Ms` 公共输入边界只转换一次。运行时字段使用 `Seconds` 后缀，不允许在更新循环中往返换算。

## 两种时间模式

### Realtime

- 每个可推进的 Laya 帧执行一次 `logicUpdate`。
- `logicDt` 使用未缩放前台 delta 加需要补入的后台经过时间，再应用 Scene timeScale。
- 不截断大 dt；恢复或卡顿后直接推进到最新逻辑状态。

### FixedTick

- 默认频率为 30 tick/秒，每次 `logicUpdate` 的 `logicDt` 固定为 `1 / 30` 秒。
- timeScale 通过改变可执行 tick 的积累速度实现，不改变单个 tick 的 dt。
- 一个 Laya 帧最多执行 5 次 `logicUpdate`；超过处理能力的积压保留，不丢 tick。
- 一个 Laya 帧执行超过 3 次逻辑更新时跳过项目级 `renderUpdate`。被跳过的 `renderDt` 累计到下次恢复渲染时一次提交。

## 暂停、后台与渲染

- 手动暂停停止逻辑时间和 tick，但仍调用 `renderUpdate`；无待表现逻辑时间时 `renderDt` 为 0。
- SceneMgr 在舞台不可见期间显式阻断全部 Scene 更新，不能依赖平台停止 `requestAnimationFrame`；Laya 后台低频 Timer 不得推进逻辑或表现。
- FixedTick 进入后台按暂停处理，忽略后台经过时间并从原 tick 恢复。
- Realtime 恢复时补入完整后台经过时间，直接推进最新状态。
- 后台冻结不修改 `SceneTime.isPaused`。玩家进入后台前若已主动暂停，恢复前台后仍保持暂停，只有显式玩家操作可以恢复。
- 后台经过时间只能由 SceneMgr 在可见性边界用单调时钟测量；该墙钟值不得继续向 gameplay 传播。
- 逻辑与渲染互不驱动。动画、FSM 和 Action 完成条件使用逻辑时间；渲染只表现已经形成的最新逻辑状态。

## Action 与持续时间约束

- Action 的计划触发时间固定为 `startTime + delay`，不能在补处理发生时改为 `curTime + delay`。
- Realtime 大步长跨过多个 Action 时，按计划时间顺序执行所有已到期 Action，再判断状态结束。
- 技能、Buff、动画等持续状态保存逻辑开始/结束时间并与传入的 `curTime` 比较，不建立独立 Timer，不使用资源播放完成回调。
- 延迟 Action、AnimationAction 和其他 Runtime 可以暂存本次业务关系所需的计划时间，但不得读取墙钟绕过 Scene 暂停、倍速或回放控制。

## 场景缓存

进入 Scene 缓存只复用 Scene 类实例，不保留运行态。退出时必须清空对象、地图实例、Camera、Layer 引用、空间索引、异步令牌和全部时间状态；缓存恢复按新一轮 `onEnter()` 完整初始化。底层资源复用属于 ResourceMgr/Laya.loader，不属于 Scene 运行态缓存。

## Camera2D 边界

- `SceneCamera2D` 的 `x/y` 始终表示世界空间中的视口左上角；`lookAt()` 和 `setTarget()` 接收需要位于视口中心的世界点语义，不得混用两套坐标定义。边界裁剪作用于视口左上角；地图小于视口时对应轴固定为 0。
- Fixed、Drag、Follow 三种模式互斥。`BaseScene` 默认选择 Fixed，具体 Scene 只能通过 `configureCamera()` 显式取得拖拽输入所有权或进入其他模式。
- Follow 跨帧只保存实体 `uid`，每次更新通过当前 Scene 的 `getLiveObject(uid)` 解析；对象不存在或已释放时退出 Follow 并保留最后一个合法视口。
- 原生 `Camera2D` 位移与场景根节点平移是二选一的渲染后端。切换后端时必须把未使用的一方归零，禁止两者同时施加视口位移。
- 场景拖拽只接受 Scene2D 根节点子树或 Stage 空白处发起的指针，不接管 UI、弹窗或其他 LayerMgr 根节点。按下后移动不足 12 像素仍视为点击，超过阈值才取得拖拽所有权。
- Camera、拖拽监听和 Stage resize 监听属于单次 Scene 运行态。场景退出或销毁时必须解绑；Stage 尺寸变化和地图就绪后必须重新计算视口边界。
