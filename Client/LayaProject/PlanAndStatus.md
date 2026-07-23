# 当前开发计划

## 当前目标

先评估并逐项确认 Scene、SceneObj、时间驱动、UI 主题与通用 Dialog 的基础设计问题；只有形成明确决议的项目才进入实现和 DESIGN 约束，之后再恢复战斗场景闭环和帧动画性能优化。每一批实现保持可独立编译、可回退、可在 LayaAir IDE 验收。

## 当前优先顺序

- [ ] Scene 时间调度基础层及 SceneObj/HUD/Buff/Skill 的显式 owner、显式时间接口已实现；继续迁移 AnimationAction、技能状态结束时间和剩余 gameplay 时间来源，清理单位往返与播放完成回调。具体约束与验收见 `src/logic/scene/DESIGN.md`、`src/logic/scene/PlanAndStatus.md`。
- [ ] 评估并确认是否为 UI 建立语义化文字样式源，以及采用 TS、JSON 或其他承载形式；候选范围包括页面标题、面板标题、正文、按钮、说明和数值的字号、颜色、描边与使用场景。
- [ ] 在 LayaAir IDE 验证 CommonDialog 的仅确定与确定/取消两种 Controller 页面、按钮位置、文字更新、关闭回调及缓存重开不重复响应。
- [ ] 完成上述基础整改后，回到战斗入口、SceneObj 生命周期和 100/200/400 角色性能基线。

## 当前起点

- 主流程当前通过 `StartMain.enterGame()` 调用 `SceneMgr.switchScene(1)` 进入 `MainScene`。
- 主界面已经通过 FunctionOpen `1001` 控制征战入口；玩家升至 2 级后可以进入 `BattleStageScene(ID=2)`。
- `BattleStageScene` 使用 `bigImg/battle_stage_map_forest.png` 并支持竖向拖拽；第一关点击后进入 `BattleScene(ID=3)`，加载 `map/map002/fightmap.json`，尚未完成运行验收。
- `MainUI` 已作为跨场景壳层供 `MainScene` 与 `BattleStageScene` 共用：顶部玩家信息和底部导航保留，未来的左右活动栏仅在 `MainScene` 显示；进入真实 `BattleScene` 时关闭整套壳层。
- 底部导航已拆出 `MainNav.json`：导航文字、图标、顺序和 routeKey 由导航表管理，开启条件仍由 FunctionOpen 管理；默认第 3 项显示为“主世界”。
- `BattleStageScene` 已改为按 `SceneType.stagePrefab` 加载大关 prefab，并由 `BattleStage.json` 驱动节点图标和点击战斗；当前 `stage001.lh` 仅第一关具备独立有效位置，`stage1002`～`stage1005` 坐标重叠且缺少 `stage1006`，首次闭环只验收第一关，其余节点仍属于后续 prefab 化任务。
- 已记录统一的世界交互与 UI 分层方案：见 `src/logic/interaction/DESIGN.md`；后续 Sprite 点击、世界对象 popup、UnderMainUI 和 DialogMgr 需求先按该文档分类和验收。

## 执行顺序

- [ ] 在真实服务端连接下完成“登录 → 1级确认升级 → FunctionOpen 1001 开启 → 进入战斗 → 点击第一关 → 返回主城”的首次运行验收。
- [ ] 连续执行至少 3 次“进入战斗 → 返回主城 → 再次进入”，验证 Manager、地图、相机、场景对象、按钮、事件和 UI 不重复、不残留。
- [ ] 在真实场景验证征战底图的竖向拖拽边界、第一关点击和 TiledMap 加载。
- [ ] 在 LayaAir IDE 验证 `MainScene → BattleStageScene → BattleScene` 三种状态下，顶部、底栏、左右活动栏的显示规则和底栏选中态均正确。
- [ ] 在 LayaAir IDE 验证从征战界面点击背包、主世界、商店、设置后，回到主界面时选中态与点击项一致。
- [ ] 将征战地图关卡节点改为可复用 `BattleStageNode.lh` + Runtime Controller，由 `BattleStage.json` 驱动节点类型、世界坐标、开放条件和战斗路由。
- [ ] 在 `BattleStageScene` 中按场景对象层实例化普通、Boss、未开放、已通关节点，修正 `battlescene/imgs` 资源运行时路径，并完成节点点击进入 `BattleScene`。
- [ ] 将 `HealthBarView` 接入正式 HUD 资源与对象回收流程。
- [ ] 在真实场景完成碰撞、Skill/Buff 最小闭环和性能验证。

## 待确认

- [ ] 在 LayaAir IDE 发布产物中确认 `assets/testAndSample/editorResources/` 是否被自动排除；`excludeFilesRule` 只作用于 BIN 文件复制，不能作为 assets 资源排除方案。
- [ ] 确认生物、子弹和技能配置字段最终是否沿用旧工程定义。
- [ ] 确认正式 HUD 血条资源和样式。
- [ ] 为角色升级经验上限提供正式配置，并为顶部 HUD 的水晶位增加对应的 Currency Item；在此之前经验条使用每级 100 的展示基准，水晶余额显示 0。

## 验收条件

- 战斗流程可连续执行“进入、退出、再次进入”，无重复节点、事件、空间索引或资源引用。
- Map、Camera2D、HUD、碰撞和技能验证运行在同一个真实战斗场景生命周期内。
- TypeScript 检查通过，并完成 LayaAir IDE 中的场景切换实测。
- [ ] 完成连续三次进入战斗、暂停/恢复、返回/再次进入的生命周期验收。
- [ ] 帧动画高性能方案评估：以 400 个角色、iOS 微信小游戏、30 FPS 为验收目标，记录 CPU 主线程、RenderNode、DrawCall、纹理内存、GPU 内存和 JS 内存基线。
- [ ] 设计动作级帧范围配置，以 `actionName + startFrameIndex + endFrameIndex + durationMs` 描述一次动作播放；index 使用稳定的逻辑帧序号并同时映射基础帧与 mask 帧，不依赖 Atlas JSON 条目顺序；不引入 `nextAction` 或动作图。同步改造 Atlas 生成与配置校验工具，避免动作帧数被固定为六列。
- [ ] 评估 2D Mesh + 自定义 Shader 的集中渲染队列与 GPU instancing 原型；验证微信 iOS 实际渲染后端、同 Mesh/材质/Shader 条件、队伍染色和帧 UV 更新能否保持批处理，并准备非 instancing fallback。
- [ ] 实现高性能队列原型：按 atlas、shader variant、mask 资源和渲染层排序，使用可复用数组/TypedArray，禁止每帧创建对象、闭包和临时数组。
- [ ] 在 iOS 微信真机分档压测 100/200/400 角色，分别测试普通 Laya.Animation、集中队列和 GPU instancing；以稳定 30 FPS、内存预算和可接受 DrawCall 作为是否切换架构的依据。
- [ ] 在通用 Action 语言中增加 `AnimationAction`，参数为动画名，使 `Skill.Action` 能按各自 delay 安排一个或多个动画动作，不新增独立的技能动画字段。动画名与时长由 `ResFrameAnimation` 的动作信息管理，`play()` 成功时返回本次动作时长；技能状态结束时间至少为“最后一个 Action 的计划触发时间”和“每个 AnimationAction 的计划触发时间 + 对应动画时长”中的最大值。所有计划时间均由技能开始时间加配置 delay 得到，不因 Realtime 大步长下的延后补处理而重新起算；到期 Action 必须先执行，再判断技能状态结束。下层只比较统一逻辑 `curTime`，不得感知或分支判断 Realtime/FixedTick，也不得依赖动画完成回调或写死 `"attack"`。若该链路改造影响当前时间框架收敛，可在时间与 SceneObj 基础层完成后实施。
- [ ] 记录性能监测基线：100/200/400 角色，FPS、单帧耗时、CPU 主线程、JS 堆、总进程内存、GPU 纹理内存、RenderNode/Node、DrawCall/InstanceDrawCall、纹理切换、逐帧分配和 GC 停顿；30 FPS 目标对应 33.3 ms 且必须保留余量。
- [ ] 押后：集中渲染队列、TypedArray、2D Mesh/GPU instancing 以及对应 fallback；在真实 iOS 微信小游戏设备数据证明必要前，不收窄通用动画框架。
