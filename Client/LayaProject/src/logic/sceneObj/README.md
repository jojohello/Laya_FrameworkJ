# SceneObj 场景对象模块

> **定位**: 2D 场景物品体系。负责场景中可显示、可碰撞、可受击、可释放的对象基础能力。

---

## 模块说明

场景对象由 `BaseScene` 创建和管理，对象自身不直接操作全局舞台。

当前支持四类基础对象：

| 类型 | 基类 | 用途 |
|------|------|------|
| 显示类 | `DisplaySceneObj` | 静态图片、动画、Spine 展示对象 |
| 生物类 | `CreatureSceneObj` | 有模型、属性、血条、碰撞、技能入口的对象；默认作为技能和子弹的空间查询候选 |
| 战斗角色 | `CharacterSceneObj` | 从 `Character` 表加载原图与局部队伍色蒙版，通过 2D Shader 替换蒙版像素并保留原始肤色和装备色调 |
| 特效类 | `EffectSceneObj` | 图集帧动画播放后自动释放，不参与碰撞；命中与有效恢复分别触发正式受击/恢复表现 |
| 子弹类 | `BulletSceneObj` | 直线/追踪移动，轨迹碰撞，命中目标 |

---

## 快速使用

### 1. 注册对象类

场景对象通过 `Laya.ClassUtils` 创建，使用前需要注册。

```typescript
const { regClass } = Laya;
import { CreatureSceneObj } from "./CreatureSceneObj";

@regClass()
export class MonsterObj extends CreatureSceneObj {
    getObjType(): number {
        return SceneObjType.Monster;
    }
}
```

如果通过 `BaseScene.addObjectToScene("MonsterObj", ...)` 的短名称创建，还必须在逻辑组合根显式注册运行时查找键：

```typescript
Laya.ClassUtils.regClass("MonsterObj", MonsterObj);
```

`@regClass()` 负责编辑器资源身份，不能替代 `ClassUtils.getClass(shortName)` 所需的稳定短名称注册。

### 2. 创建对象

```typescript
const obj = scene.addObjectToScene("MonsterObj", 1, 2, 300, 200, 0);
```

战斗角色直接使用 LayaAir 标准的“单张 PNG + `.atlas`”帧动画资源，不再维护独立的 idle 单图与队伍色蒙版。`CharacterAnimation` 表为每个动作配置 `actionName`、包含首尾的 `startFrameIndex/endFrameIndex` 和 `durationMs`。基础帧与对应队伍色蒙版帧共用逻辑索引，现有 atlas 子纹理按 `{actionName}_{localIndex}.png` 和 `{actionName}_mask_{localIndex}.png` 命名；循环性由 Idle/Run 或技能调用明确传入，不保存在动作配置中。原图始终保持原色，蒙版 Alpha 表示可染色权重；`character-team-color.shader` 在每帧更新主图和蒙版图集 UV 后替换队伍色，并保留肤色和装备色调。队伍颜色默认由 `CharacterSceneObj` 根据 `team` ID 初始化，并在材质异步创建或重新绑定时重复应用；`setTeamColor(r, g, b)` 仅用于明确的运行时覆写。同一职业不复制红蓝两套完整资源。角色必须配置至少一个可播放的帧动画动作。

角色兵种、缩放、战斗特效中心点和按优先级排列的技能列表统一配置在 `Config/csv/Character.csv`，动作图集资源配置在 `Config/csv/CharacterAnimation.csv`。`centerOffsetY` 是从逻辑脚底点到战斗受击/恢复特效中心的 Y 位移（负数向上）；`skillIds` 使用分号分隔。技能 CD 和施法距离来自 Skill 表，不建立 AI 模板配置。当前三名角色的显示缩放均为 `0.666667`，特效中心偏移均为 `-52`。

帧动画由角色 Entity 的每帧更新使用场景游戏时间驱动，暂停、加速和减速与场景逻辑保持一致；每个动画实例不再创建独立 Timer。Laya 仍逐帧提交场景渲染，只有动画帧索引变化时才重写主图、蒙版和对应 UV，角色位置变化不受换帧频率限制。

BattleScene 的 Entity 动画与战斗状态已完成 LayaAir IDE 的暂停/恢复、1×/2×和连续三次切场验证。恢复后动画从原逻辑状态继续；重新进入时动画、对象表和战斗时间重新初始化，不继承上一场运行态。

参数含义：

| 参数 | 说明 |
|------|------|
| `className` | 注册类名 |
| `cfgId` | 配置 ID |
| `team` | 队伍 ID |
| `x/y` | 初始逻辑坐标 |
| `angle` | 初始角度 |

### 3. Camera2D 跟随对象

```typescript
const monster = scene.getObject(uid);
if (monster && scene.camera) {
    scene.camera.follow(monster.uid);
}
```

### 4. 创建子弹

```typescript
const bullet = scene.addObjectToScene("BulletSceneObj", 1, 1, caster.x, caster.y, 0) as BulletSceneObj;
bullet.initLineMovement(caster.uid, target.x, target.y, 500, 20, target.team);
```

---

## 常用 API

### BaseSceneObj

| API | 说明 |
|-----|------|
| `setPos(x, y)` | 设置逻辑坐标 |
| `setAngle(angle)` | 设置角度 |
| `setZOffset(value)` | 设置显示高度偏移 |
| `setCollisionBox(range)` | 设置命中候选半径；仅覆盖 `canEnterSpatialIndex()` 的实体会进入空间分割 |
| `addModule(module)` | 添加跟随对象缓存的功能模块 |
| `getModule(ModuleClass)` | 获取指定类型的功能模块 |
| `hasModule(ModuleClass)` | 判断是否存在指定类型模块 |
| `removeModule(ModuleClass, curTime)` | 移除指定类型模块，并使用显式场景逻辑时间完成清理 |
| `release()` | 标记对象释放 |

### ISceneObjModule

模块跟随 `SceneObj` 一起缓存，适合承载 HUD、AI、Skill 等可拆分能力。外部业务仍建议优先调用 `SceneObj/CreatureSceneObj` 上的便捷接口，不直接依赖具体模块实现。

| Hook | 说明 |
|------|------|
| `reset(owner, curTime)` | 对象复用并开始新生命周期前调用 |
| `onOwnerInit(owner)` | 对象初始化完成后调用 |
| `onOwnerLogicUpdate(owner, logicDt, curTime, tick)` | 对象权威逻辑更新阶段调用 |
| `onOwnerLateLogicUpdate(owner, curTime, tick)` | 对象 late logic 阶段调用 |
| `onOwnerRenderUpdate(owner, renderDt, curTime, tick, interpolationAlpha)` | 对象表现更新阶段调用 |
| `onOwnerFixedUpdate(owner, curTime, tick)` | 对象低频逻辑阶段调用 |
| `onOwnerConfirmPos(owner)` | 对象显示位置确认变化后调用 |
| `onRecycle(owner, curTime)` | 对象回收到对象池前调用 |
| `onDispose(owner, curTime)` | 对象彻底销毁时调用 |

模块由 SceneObj 单向持有。模块不得缓存 owner；需要宿主参与的生命周期和业务方法按调用显式传入 owner。

### CreatureSceneObj

| API | 说明 |
|-----|------|
| `setMaxHp(value)` | 设置最大生命，按差值同步当前生命 |
| `showHealthBar(show, options)` | 启用/关闭 HUD 血条；满血和死亡时隐藏、受伤后显示；战斗场景当前通过 `showMpBar: false` 关闭 MP 蓝条 |
| `getDamage(casterId, damage, curTime)` | 受到伤害 |
| `heal(value, curTime?)` | 治疗并返回实际恢复量；满血时返回 `0`，有效恢复会投递统一战斗跳字 |
| `castSkill(skillId, curTime, targetId, x, y, skillLevel)` | 技能入口，内部走 `SkillAgent`；牧师 AI 优先对最近受伤友军使用 `TargetType=Ally` 的治疗技能 |
| `canCastSkill(skillId, curTime)` | 检查技能 CD |
| `getSkillCooldownRemainSeconds(skillId, curTime)` | 获取技能剩余 CD，单位秒 |
| `isSkillExecuting()` | 当前是否仍在技能计划执行期 |
| `runTo(x, y, curTime, stopDistance)` | 按 speed 属性跑向世界坐标，FSM 自动管理 Run/Idle 和 walk/idle 动画 |
| `attack(skillId, curTime, targetId, x, y, skillLevel)` | 成功释放技能后进入 Attack |
| `addBuff(buffId, casterId, curTime, stack, durationOverrideMs)` | 添加 live-caster Buff；Runtime 只保存 casterId，覆盖时长在进入 Runtime 时由毫秒转换为秒 |
| `removeBuff(buffId, curTime)` | 移除指定 Buff |
| `hasBuff(buffId)` | 检查是否存在指定 Buff |

### BulletSceneObj

| API | 说明 |
|-----|------|
| `initLineMovement(...)` | 初始化直线子弹 |
| `initTraceMovement(..., flyTimeSeconds)` | 使用运行时秒初始化追踪子弹 |
| `configureCollision(...)` | 配置实时/间隔、轨迹/范围、排序、排重/重复、命中计数等碰撞策略 |
| `setVisualResource(atlasPath)` | 使用标准子弹图集默认播放全部 `frame_00..frame_05`，90ms 一帧、50px 显示并循环 |
| `setVisualFrameAnimation(options)` | 自定义图集路径、帧前缀、帧数、帧间隔和显示尺寸；只控制表现，不改变命中范围 |
| `getCasterId()` | 获取施法者 ID |

子弹的 `Bullet.Resource` 可为空；为空时保留代码圆点兜底。正式图集使用一张透明 PNG 与同名 `.atlas`，帧键按 `frame_00.png` 递增命名。带朝向的飞行资源以“朝右”为源图基准；直线弹在起飞时、追踪弹在转向时旋转子弹模型，动画子节点继承该旋转，故拖尾始终位于运动后方。子弹只有一个固定循环动作，因此不建立 `CharacterAnimation` 风格的动作范围/时长配置表；需要特殊帧数、速度或尺寸时，由创建代码显式调用 `setVisualFrameAnimation(options)`。

---

### EffectSceneObj

`EffectSceneObj.setFrameAnimation(options, curTime)` 播放一次性 PNG + atlas 图集动画；默认不循环，并由场景逻辑时间释放。`EffectSceneObj.playCombatEffect(...)` 只接收场景、特效配置 ID、队伍和坐标快照；`CombatEffect.csv` 定义图集、时长、缩放和帧数，可由每个 `Damage` Action 指定，不持有目标实体。

## 坐标和 zOffset

`Transform2D` 只存储逻辑坐标 `x/y`，不存储 z。

显示位置计算：

```
displayX = x + offsetX
displayY = y + offsetY + zOffset
```

碰撞检测只使用逻辑平面：

```
collision = x / y / range
```

---

## 相关文件

- [DESIGN.md](DESIGN.md) - 技术设计、方案取舍、技术债务
- [PlanAndStatus.md](PlanAndStatus.md) - 当前未完成工作与验收条件
- [BaseSceneObj.ts](BaseSceneObj.ts) - 场景对象基类
- [DisplaySceneObj.ts](DisplaySceneObj.ts) - 显示类对象
- [CreatureSceneObj.ts](CreatureSceneObj.ts) - 生物类对象
- [EffectSceneObj.ts](EffectSceneObj.ts) - 特效类对象
- [BulletSceneObj.ts](BulletSceneObj.ts) - 子弹类对象
- [../scene/SceneCamera2D.ts](../scene/SceneCamera2D.ts) - 场景相机封装

---
## Character frame-animation defaults

Plan the frame count before producing an animation source sheet. The current default is six frames for ordinary `idle` and `walk` loops; `walk` uses a 600 ms total duration (10 FPS) and must visibly alternate left/right contact poses. The inclusive configured frame range length must match the source columns and atlas entries.

### Run-cycle production checklist

For a six-frame run, reserve the middle frames for passing/收腿 poses. The expected rhythm is `contact A -> down -> close passing -> compact push -> contact B -> close passing`. The two contact frames must have opposite leading feet, while the passing frames keep one foot close to the pelvis instead of leaving both legs extended.

Keep the same facing direction, hand side, character scale, and foot baseline in every frame. Drive the motion from the pelvis into the torso, shoulders, arms, and held weapon; use only a small vertical bounce. Before replacing a project resource, inspect the sliced atlas frames at their real cell size and remove panel borders, neighboring-frame fragments, green spill, and detached artifacts. Preserve idle/attack rows when only walk is being replaced.

### Team-color lifecycle rule

`CharacterSceneObj` initializes its team palette from the immutable `team` ID during `onInit()`. Every material creation or frame-animation material rebind must reapply the stored team color. Callers may use `setTeamColor()` for an intentional override, but ordinary battle setup must not be the only place that assigns the color; otherwise an async reload or pooled-object reset can fall back to the default red material.

Team colors also use separate Sprite2D Shader variant names per team. The current red and blue variants are `CharacterTeamColor2D_Red` and `CharacterTeamColor2D_Blue`; a future yellow team must add its own variant (for example `CharacterTeamColor2D_Yellow`) and register it before creating characters. This is required even when all teams share the same atlas, because changing only `u_TeamColor` can be overwritten by 2D render batching.
- Runtime object updates use the scene clock in seconds. Public inputs explicitly
  named `durationMs` are conversion boundaries and are stored as seconds;
  runtime duration fields use the `Seconds` suffix. Callers must not mix
  `Laya.timer.currTimer` with scene-object lifecycle timestamps.
- Character animation playback accepts an explicit planned start time and current scene time. `AnimationAction` therefore catches up by seeking, while skill completion remains based on the planned Action timeline rather than animation callbacks.
