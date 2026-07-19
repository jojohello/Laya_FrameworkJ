# SceneObj 模块设计

本文件作用于 `src/logic/sceneObj/`，并与相邻的 `scene`、`bullet`、`skill`、`buff` 模块协作。

## 边界

- 通过 `BaseScene.addObjectToScene(className, ...)` 动态创建的类型，必须在 `LogicMain` 等组合根用相同短名称调用 `Laya.ClassUtils.regClass(className, Class)`；不能只依赖编辑器 `@regClass()` 的资源身份注册。

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

- 战斗角色位图的逻辑坐标固定为脚底中心；不同职业即使透明画布尺寸一致，也不得改回图片中心锚点，否则站位、碰撞和 HUD 会产生系统性偏移。
- 队伍外观差异使用独立蒙版和纹理型 2D Shader，不为红蓝队复制整套位图，也不对整张角色图乘色。蒙版 Alpha 是染色权重；Shader 保留主图 Alpha，并用主图亮度调制高饱和红蓝队伍色。
- 主图和蒙版可能被 Laya 分别打入图集，队伍色材质必须传递各自 UV 区域并从局部 UV 做映射，不能假设两张纹理拥有相同图集坐标。
- `.shader.meta` 未声明 Shader importer 时，`Laya.loader.load(path)` 只会得到文本资源而不会注册 Shader；运行时代码必须按 `Laya.Loader.TEXT` 加载并显式调用 `Laya.ShaderParser.parse()`，随后用 `Shader3D.find()` 验证注册结果。
- LayaAir 3.3 `.shader` 的 GLSL 代码块标记必须与 IDE 内置模板一致，使用连写的 `#defineGLSL name` 和 `#endGLSL`；写成网页文档展示形式 `#define GLSL` 会静默产生 `VS/FS is empty`。
- 纹理型 Sprite2D Shader 的 attributeMap 必须与同版本引擎 `Shader2D.graphicsAttribute` 一致，包含 `a_posuv`、`a_attribColor`、`a_attribFlags`、`a_customs`；顶点阶段应转发 `v_useClip/v_customs` 并调用 `getPosition(info.pos)`。`uniformMap` 会自动生成 GLSL uniform，片元块不得重复声明同名 uniform。
- 角色动作名稳定为 `idle`、`walk`、`attack`。静态占位允许三个动作显示同一帧；正式序列帧适配器必须保持动作入口不变。
- 帧动画的主图帧与队伍蒙版帧必须一一对应；每次帧索引变化都同步更新两张子纹理及各自图集 UV。攻击等非循环动作通过配置指定后继动作，不在战斗调用方散落定时切换逻辑。
- AI 和战斗调用方通过角色实体的 `runTo()`、`attack()` 表达行为，不直接播放动画。Run 状态承载逐帧位移并在到达后回 Idle；Attack 只在技能释放成功后进入，并由动画完成事件回 Idle。状态被打断时必须清理旧移动目标，对象复用时清理全部行为运行态。

### Sprite2D Shader 错误诊断

| 运行日志或表现 | 根因 | 修复与验证 |
| --- | --- | --- |
| `Shader 加载后仍未注册` | `.shader` 被当作普通文本，未经过 ShaderParser | 按 `Loader.TEXT` 加载，显式 `ShaderParser.parse()`，再检查 `Shader3D.find()` |
| `VS/FS of pass 0 is empty` | GLSL 块标记写成了 `#define GLSL/#end GLSL` | 对照本机同版本 IDE 内置模板，使用 `#defineGLSL/#endGLSL` |
| `a_customs undeclared`、`getPosition no matching` | 自定义 attributeMap 和顶点转发落后于当前引擎 | 从当前 IDE 的 `laya.core.js` 提取 `Shader2D.graphicsAttribute` 与默认 `texture_vs`，不可照搬其他小版本 |
| uniform `redefinition` | `uniformMap` 已生成声明，GLSL 又手写了一次 | 删除 GLSL 同名 uniform 声明，只保留 uniformMap |
| Shader 编译成功但 Sprite 不显示 | 纹理宏或 2D 渲染状态缺失 | 开启 `TEXTUREVS`，关闭剔除、深度测试和深度写入，使用预乘 Alpha 的 `One / OneMinusSourceAlpha` |

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
