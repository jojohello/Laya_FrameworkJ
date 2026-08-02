# 无 UI 调用式测试包

本目录是一个可整体拷贝的 LayaAir 3.3 编辑器专用测试包。它不依赖战斗 UI，也不会把测试实体挂到正式场景层。

测试夹具、对象池生命周期和 IDE 场景脚本缓存的稳定约束见上级 [DESIGN.md](../DESIGN.md)。

本包位于 `assets/testAndSample/testBulletLifecycle/`：场景和说明位于包根目录，`scripts/` 放可挂载的 TypeScript 与用例。直接场景入口为兼容 IDE 预览而允许 Runtime 加载，只可作为开发期回退入口，不能单独作为正式包排除证明。

## 在当前项目运行

1. 用 LayaAir IDE 打开 `HeadlessTestScene.ls`。
2. 将 `scripts/HeadlessTestScene.ts` 挂到场景根节点（首次由 IDE 写入组件和 `.meta`，不要手工伪造 UUID）。
3. 直接运行该场景，查看控制台 `[HeadlessTest]` 的 PASS / FAIL / SUMMARY。

当前回归基线包含两类子弹边界：

- `BulletLiveTargetHitCase`：直线子弹命中一个存活目标恰好一次，并在命中后回收；
- `BulletLineLifetimeRegressionCase`：直线子弹没有命中目标时，必须在配置的飞行时间到期后回收；
- `BulletReleaseRegressionCase`：追踪子弹启动后目标被释放并从对象池复用，子弹必须取消，复用后的新实体不得受击。
- `SceneDestroyRecreateRegressionCase`：场景销毁后重新创建测试世界，已回池实体必须取得新 UID，旧 UID、对象表和空间索引不得泄漏到新场景（已通过 IDE 插件入口运行）。
- `SkillReleaseRegressionCase`：延迟 Skill Action 排队后施法者释放并回池复用，旧 Action 不得执行，复用对象不得保留施法状态（已通过 IDE 插件入口运行）。
- `BuffReleaseRegressionCase`：Buff Tick 到期前目标释放并回池复用，旧 Tick 不得作用于复用对象，复用对象不得保留旧 Buff（已通过 IDE 插件入口运行）。

场景、Runner、公共无显示世界/实体/子弹夹具和所有用例均集中在当前测试包；其中可复用夹具是 `scripts/HeadlessBattleTestSupport.ts`，具体回归用例位于 `scripts/scenarios/`。

`AISchedulerLifecycleRegressionCase` 使用真实 `AIScheduler` 和 `AIAgent` 验证三组轮转、释放 UID 自动移除、回池复用对象不会继承旧调度，以及注销和 `clear()` 后不再执行。

`CrowdAvoidanceRegressionCase` 验证同队前方阻挡会在重叠前产生保持前进分量的稳定侧移；阻挡者释放后旧 UID 不再影响位移，回池复用后的新 UID 按新阻挡者处理。

`CrowdAvoidanceArrivalRegressionCase` 验证绕行后 Run 能进入攻击距离并回 Idle，同时锁定“技能范围触碰目标 `range` 边沿即可释放”的共享距离契约。`CrowdAvoidanceRegressionCase` 还验证修改实体 `range` 会直接改变局部避让占位，不存在独立 `radius`。

## 新增用例

在 `scripts/scenarios/` 新建一个实现 `HeadlessTestCase` 的类，再在 `scripts/HeadlessTestScene.ts` 的数组中注册。用例必须：

- 只驱动真实 `BaseScene.update()`；
- 明确输入与可观察断言；
- 在 `finally` 中销毁自己的测试世界；
- 保持无 UI、无正式入口引用。

## 复用到其他项目

复制整个 `assets/testAndSample/testBulletLifecycle/` 到目标项目的 `assets/testAndSample/` 下。若需发布安全的调用式入口，配套采用 `testBulletLifecycleEditorPlugin/` 的 `@IEditor.menu` → `Editor.scene.runScript` → `@IEditorEnv.regClass` 模式；若项目的场景对象入口或生命周期不同，仅替换 `scripts/scenarios/` 里的适配用例。微信等正式构建后仍须搜索产物确认测试资源和脚本不存在。
