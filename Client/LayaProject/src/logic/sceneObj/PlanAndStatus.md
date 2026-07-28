# SceneObj 当前计划

## 当前目标

在真实战斗场景生命周期内完成 SceneObj、Camera2D、HUD 和战斗反馈验证，保证伤害、血条、子弹、受击与 Buff 表现和实体生命周期一致。

## 待完成

- [ ] 在 LayaAir IDE 完成实体 ID 迁移验证：基础攻击和子弹命中已有初步运行结果；Buff 尚未验证。继续覆盖 HUD、Buff、Skill、Bullet、Camera follow 和 AI 调度在创建、延迟执行、caster release、移除、死亡、回池、销毁和再次复用后的行为，确认无旧 owner/caster/target 引用或计划 Action 残留；纯快照只使用展开的基础值。
- [ ] 在战斗入口可重复进入后，增加示例对象注册与创建验证。
- [ ] 补充验证角色动画与技能时序的极端路径：Realtime 大步长追帧、暂停、加速和回池复用后无旧状态残留；基础攻击、伤害/子弹触发及 Attack 回 Idle 主链路已通过运行验证。
- [ ] 在 LayaAir IDE 验证共享 `SimpleCombatTree` 和 BattleScene 三组 `AIScheduler`：两队角色选择最近的同类敌方实体，按 `Skill.CastRange` 靠近，在 CD 可用时释放基础攻击，攻击期间不重复决策；死亡、切场和回池后调度 ID、目标、技能与 AI 时间状态无残留。
- [ ] 验证 Camera2D 拖拽、跟随、地图边界、输入归属和场景切换。
- [ ] 验证对象 release、回池、再次复用后无模型、事件、动画、坐标和空间 hash 残留。
- [ ] 确认生物、子弹配置字段及 Spine 的 ResourceMgr 适配方式；图片和标准 atlas 帧动画已分别使用 `ResImage`、`ResFrameAnimation`。
- [ ] 确认正式血条资源，将 `HealthBarView` 完成 HUD 层接入和回收验证。
- [ ] 接入伤害跳字，并验证同一伤害事件只生成一次表现、跟随目标坐标更新且在目标回池/销毁时清理。
- [ ] 接入子弹特效、受击特效和 Buff 恢复特效；特效必须绑定事件时间，不得在实体回池后继续访问旧 owner/caster/target。
- [ ] 在 400 对象场景记录空间查询、碰撞、HUD 更新和 GC 表现。

## 依赖与验收

- 依赖根计划中的战斗入口和战斗场景切换闭环。
- 对象可连续执行创建、释放、回池、复用，状态与空间索引正确。
- Camera2D 和 HUD 在切场前后行为一致，并通过 LayaAir IDE 实测。
- 伤害跳字、血条、子弹、受击和 Buff 特效在创建、延迟执行、死亡、回池、销毁和再次复用后无重复、残留或旧实体引用。
- [ ] 将 400 角色性能监测指标固化并执行 100/200/400 分档基线；集中队列/GPU instancing 仅作为后续优化，不作为当前框架必选能力。
