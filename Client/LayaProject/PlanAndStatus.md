# 当前开发计划

## 当前目标

完成可重复进入、初始化、退出并回切的战斗场景闭环，为 Map、Camera2D、HUD、碰撞和技能系统提供真实生命周期载体。

## 当前起点

- 主流程当前通过 `StartMain.enterGame()` 调用 `SceneMgr.switchScene(1)` 进入 `MainScene`。
- 主界面已经通过 FunctionOpen `1001` 控制征战入口；玩家升至 2 级后可以进入 `BattleStageScene(ID=2)`。
- `BattleStageScene` 使用 `bigImg/battle_stage_map_forest.png` 并支持竖向拖拽；第一关点击后进入 `BattleScene(ID=3)`，加载 `map/map002/fightmap.json`，尚未完成运行验收。
- `MainUI` 已作为跨场景壳层供 `MainScene` 与 `BattleStageScene` 共用：顶部玩家信息和底部导航保留，未来的左右活动栏仅在 `MainScene` 显示；进入真实 `BattleScene` 时关闭整套壳层。
- 底部导航已拆出 `MainNav.json`：导航文字、图标、顺序和 routeKey 由导航表管理，开启条件仍由 FunctionOpen 管理；默认第 3 项显示为“主世界”。
- `BattleStageScene` 已改为按 `SceneType.stagePrefab` 加载完整大关 prefab；`stage001.lh` 的底图和 `stage1001`～`stage1006` 节点整体缩放到配置尺寸并水平居中，节点图标和点击战斗由 `BattleStage.json` 驱动。
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
