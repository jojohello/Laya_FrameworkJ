# SceneObj 当前计划

## 当前目标

在真实战斗场景生命周期内完成 SceneObj、Camera2D 和 HUD 验证。

## 待完成

- [ ] 在战斗入口可重复进入后，增加示例对象注册与创建验证。
- [ ] 在 LayaAir IDE 验证战法牧三套单图 atlas 的 `idle/walk/attack` 播放、攻击结束回 idle、逐帧红蓝染色和 `0.666667` 缩放，以及进入、退出、再次进入时动画、材质、对象表和空间索引无残留。
- [ ] 验证 Camera2D 拖拽、跟随、地图边界、输入归属和场景切换。
- [ ] 验证对象 release、回池、再次复用后无模型、事件、动画、坐标和空间 hash 残留。
- [ ] 确认生物、子弹配置字段及 Spine 的 ResourceMgr 适配方式；图片和标准 atlas 帧动画已分别使用 `ResImage`、`ResFrameAnimation`。
- [ ] 确认正式血条资源，将 `HealthBarView` 完成 HUD 层接入和回收验证。
- [ ] 在 400 对象场景记录空间查询、碰撞、HUD 更新和 GC 表现。

## 依赖与验收

- 依赖根计划中的战斗入口和战斗场景切换闭环。
- 对象可连续执行创建、释放、回池、复用，状态与空间索引正确。
- Camera2D 和 HUD 在切场前后行为一致，并通过 LayaAir IDE 实测。
