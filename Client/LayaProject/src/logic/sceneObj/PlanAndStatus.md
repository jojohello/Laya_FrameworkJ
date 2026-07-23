# SceneObj 当前计划

## 当前目标

在真实战斗场景生命周期内完成 SceneObj、Camera2D 和 HUD 验证。

## 待完成

- [ ] 在 LayaAir IDE 验证实体 ID 迁移：HUD、Buff、Skill、Bullet、Camera follow 和 AI 调度在创建、延迟执行、caster release、移除、死亡、回池、销毁和再次复用后行为正确，无旧 owner/caster/target 引用或计划 Action 残留；纯快照只使用展开的基础值。
- [ ] 在战斗入口可重复进入后，增加示例对象注册与创建验证。
- [ ] 在 LayaAir IDE 验证战法牧三套单图 atlas 的 `idle/walk/attack` 播放、攻击结束回 idle、逐帧红蓝染色和 `0.666667` 缩放，以及进入、退出、再次进入时动画、材质、对象表和空间索引无残留。
- [ ] 在战斗驱动接入后验证角色 `Idle / Run / Attack` 状态切换：Run 映射 walk；技能通过通用 `AnimationAction` 按配置 delay 播放指定动画，`ResFrameAnimation.play()` 返回对应时长，技能状态结束时间取最后 Action 计划触发时间与各动画计划结束时间的最大值。到期 Action 先执行、技能状态后结束；FSM 不写死 `"attack"`，不判断动画 action 名，不依赖动画播放完成回调；回池复用后无旧状态残留。
- [ ] 在 LayaAir IDE 验证共享 `SimpleCombatTree` 和 BattleScene 三组 `AIScheduler`：两队角色选择最近的同类敌方实体，按 `Skill.CastRange` 靠近，在 CD 可用时释放基础攻击，攻击期间不重复决策；死亡、切场和回池后调度 ID、目标、技能与 AI 时间状态无残留。
- [ ] 验证 Camera2D 拖拽、跟随、地图边界、输入归属和场景切换。
- [ ] 验证对象 release、回池、再次复用后无模型、事件、动画、坐标和空间 hash 残留。
- [ ] 确认生物、子弹配置字段及 Spine 的 ResourceMgr 适配方式；图片和标准 atlas 帧动画已分别使用 `ResImage`、`ResFrameAnimation`。
- [ ] 确认正式血条资源，将 `HealthBarView` 完成 HUD 层接入和回收验证。
- [ ] 在 400 对象场景记录空间查询、碰撞、HUD 更新和 GC 表现。

## 依赖与验收

- 依赖根计划中的战斗入口和战斗场景切换闭环。
- 对象可连续执行创建、释放、回池、复用，状态与空间索引正确。
- Camera2D 和 HUD 在切场前后行为一致，并通过 LayaAir IDE 实测。
- [ ] 把角色动画配置简化为 `actionName + startFrameIndex + endFrameIndex + durationMs`，允许不同动作使用不同长度、不同总播放时间的连续逻辑帧范围；一个逻辑帧同时映射基础帧与 mask 帧。
- [ ] 在 LayaAir IDE 验证 Entity 驱动的帧动画在暂停、战斗 HUD 1×/2×切换、攻击完成、对象回池和再次进入时状态一致且无独立 Timer 残留。
- [ ] 将 400 角色性能监测指标固化并执行 100/200/400 分档基线；集中队列/GPU instancing 仅作为后续优化，不作为当前框架必选能力。
