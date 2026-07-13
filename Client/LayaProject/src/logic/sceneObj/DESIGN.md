# SceneObj 模块设计

本文件作用于 `src/logic/sceneObj/`，并与相邻的 `scene`、`bullet`、`skill`、`buff` 模块协作。

## 边界

- `BaseScene` 拥有场景根节点、标准层级、Camera2D、对象表和空间分割；`SceneObj` 不直接操作全局场景状态。
- SceneObj 显示节点只能挂到所属 Scene 的 Layer，缺少 Scene 或 Layer 时直接报错并停止挂载，不允许回退到 `Laya.stage`。
- `BaseSceneObj` 只保留 uid、配置、队伍、Scene、Transform2D、生命周期、释放状态、模块容器和基础空间索引入口。
- HUD、AI、Skill 等新增能力优先实现为 `ISceneObjModule`，同时由 SceneObj 提供稳定的业务便捷入口，避免调用方依赖模块内部实现。

## 生命周期与对象池

- `release()` 只进入延迟删除流程，并立即停止碰撞和空间查询；重复调用必须安全。
- 帧尾由 `BaseScene.deleteObjectFromScene()` 统一移除并决定回池或销毁。
- `reset()` 清理上一轮状态，发生在复用对象的新一轮 `init()` 前。
- `onRecycle()` 只移除父节点、隐藏、解绑事件和清理运行引用，不销毁可复用显示对象。
- `onDispose()` 才彻底销毁。`ISceneObjModule` 跟随宿主缓存，不建立独立模块池。
- `update/lateUpdate/fixedUpdate` 必须跳过已 release 的对象。

场景缓存恢复默认按当前对象表重建空间索引。只有明确的后台保活场景才可关闭重建；发现空间表缺失或禁用时仍需兜底重建。

## 坐标、属性与刷新

- `Transform2D` 保存逻辑平面的 `x/y`；`zOffset` 只影响显示，不参与碰撞。
- 显示位置为 `x + offsetX`、`y + offsetY + zOffset`。
- 空间 hash 只在位置变化、碰撞配置变化或重绑定时刷新；静止且无索引的对象不做网格计算。
- 属性按整数语义使用。百分比采用万分位，`10000 = 100%`；可计算属性公式为 `ceil((base + add) * (10000 + percent) / 10000)`。
- HP 等当前值使用直接值接口；最大生命变化时当前生命按差值同步并限制在有效范围。
- HUD 位置通过位置确认钩子刷新，不做无条件逐帧定位。

## 子弹协作

子弹行为拆为 Movement、Collision 和命中 Action 三类职责。`BulletSceneObj` 组合策略，不重新实现所有维度的条件分支。

- 直线弹默认实时轨迹碰撞；穿透语义为最大命中数。
- 追踪弹默认抵达目标后只命中目标并结束，不再追加轨迹碰撞。
- 持续范围类可配置间隔查询、重复命中和不按命中数结束。
- 只有依赖命中顺序的策略才保留轨迹结果排序。
- 命中结果走通用 Action 链路，SceneObj 不持有旧 EffectGroup 特例。

## 必须实测的风险

- Camera2D 与 Area2D 的承载方式、输入归属及多场景缓存切换。
- 对象回池后模型、事件、动画、坐标、空间 hash 和模块运行态无残留。
- 正式 HUD 资源的跟随、层级、遮挡和回收。
- Spine 等真实模型通过 ResourceMgr 加载和回收的策略。
