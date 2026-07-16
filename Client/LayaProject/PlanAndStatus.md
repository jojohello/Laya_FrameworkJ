# 当前开发计划

## 当前目标

完成可重复进入、初始化、退出并回切的战斗场景闭环，为 Map、Camera2D、HUD、碰撞和技能系统提供真实生命周期载体。

## 当前起点

- 主流程当前通过 `StartMain.enterGame()` 调用 `SceneMgr.switchScene(1)` 进入 `MainScene`。
- 主界面已经通过 FunctionOpen `1001` 控制战斗地图入口；玩家升至 2 级后可以进入 `BattleScene(ID=2)`。
- `BattleScene` 已关联 `map/map002/fightmap.json`，提供配置驱动的第一关入口和返回主城按钮，尚未完成连续切换的运行验收。

## 执行顺序

- [ ] 在真实服务端连接下完成“登录 → 1级确认升级 → FunctionOpen 1001 开启 → 进入战斗 → 点击第一关 → 返回主城”的首次运行验收。
- [ ] 连续执行至少 3 次“进入战斗 → 返回主城 → 再次进入”，验证 Manager、地图、相机、场景对象、按钮、事件和 UI 不重复、不残留。
- [ ] 在真实战斗场景验证 Map 信息读取及 Camera2D 拖拽、跟随和边界。
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
