# SceneObj 场景对象模块

> **定位**: 2D 场景物品体系。负责场景中可显示、可碰撞、可受击、可释放的对象基础能力。

---

## 模块说明

场景对象由 `BaseScene` 创建和管理，对象自身不直接操作全局舞台。

当前支持四类基础对象：

| 类型 | 基类 | 用途 |
|------|------|------|
| 显示类 | `DisplaySceneObj` | 静态图片、动画、Spine 展示对象 |
| 生物类 | `CreatureSceneObj` | 有模型、属性、血条、碰撞、技能入口的对象 |
| 战斗角色 | `CharacterSceneObj` | 从 `Character` 表加载原图与局部队伍色蒙版，通过 2D Shader 替换蒙版像素并保留原始肤色和装备色调 |
| 特效类 | `EffectSceneObj` | 播放后自动释放，不参与碰撞 |
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

战斗角色的静态回退资源为 `assets/character/{cfgId}/idle.png` 和同尺寸的 `team_mask.png`。正式帧动画采用 LayaAir 标准的“单张 PNG + `.atlas`”资源；基础帧和对应队伍色蒙版帧可位于同一大图，由 `CharacterAnimation` 表配置 `idle`、`walk`、`attack` 的子纹理前缀、帧数、间隔、循环和后继动作。原图始终保持原色，蒙版 Alpha 表示可染色权重；`character-team-color.shader` 在每帧更新主图和蒙版图集 UV 后替换队伍色，并保留肤色和装备色调。队伍颜色通过 `CharacterSceneObj.setTeamColor(r, g, b)` 的三个 `0~255` RGB 参数设置，同一职业不复制红蓝两套完整资源。未配置帧动画的角色继续显示静态回退图。

角色模型、兵种、缩放、技能列表和 AI 模板引用统一配置在 `Config/csv/Character.csv`，动作资源配置在 `Config/csv/CharacterAnimation.csv`。`skillIds` 使用分号分隔，`aiTemplateId=0` 表示尚未分配正式模板；当前三名角色的显示缩放均为 `0.666667`。

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
    scene.camera.follow(monster);
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
| `setCollisionBox(range)` | 开启碰撞盒并进入空间分割 |
| `addModule(module)` | 添加跟随对象缓存的功能模块 |
| `getModule(ModuleClass)` | 获取指定类型的功能模块 |
| `hasModule(ModuleClass)` | 判断是否存在指定类型模块 |
| `removeModule(ModuleClass)` | 移除指定类型模块并清理 |
| `release()` | 标记对象释放 |

### ISceneObjModule

模块跟随 `SceneObj` 一起缓存，适合承载 HUD、AI、Skill 等可拆分能力。外部业务仍建议优先调用 `SceneObj/CreatureSceneObj` 上的便捷接口，不直接依赖具体模块实现。

| Hook | 说明 |
|------|------|
| `onAttach(owner)` | 模块添加到对象时调用 |
| `onDetach(owner)` | 模块移除或对象销毁时调用 |
| `reset()` | 对象复用并开始新生命周期前调用 |
| `onOwnerInit(owner)` | 对象初始化完成后调用 |
| `onOwnerUpdate(owner, curTime)` | 对象 update 阶段调用 |
| `onOwnerLateUpdate(owner, curTime)` | 对象 lateUpdate 阶段调用 |
| `onOwnerFixedUpdate(owner, curTime)` | 对象 fixedUpdate 阶段调用 |
| `onOwnerConfirmPos(owner)` | 对象显示位置确认变化后调用 |
| `onRecycle()` | 对象回收到对象池前调用 |
| `onDispose()` | 对象彻底销毁时调用 |

### CreatureSceneObj

| API | 说明 |
|-----|------|
| `setMaxHp(value)` | 设置最大生命，按差值同步当前生命 |
| `showHealthBar(show)` | 显示/隐藏血条 |
| `getDamage(casterId, damage)` | 受到伤害 |
| `heal(value)` | 治疗 |
| `castSkill(skillId, targetId, x, y, skillLevel)` | 技能入口，内部走 `SkillAgent` |
| `canCastSkill(skillId)` | 检查技能 CD |
| `getSkillCooldownRemain(skillId)` | 获取技能剩余 CD，单位毫秒 |
| `addBuff(buffId, caster, stack, durationOverride, curTime)` | 添加 Buff，内部走 `BuffAgent` |
| `removeBuff(buffId)` | 移除指定 Buff |
| `hasBuff(buffId)` | 检查是否存在指定 Buff |

### BulletSceneObj

| API | 说明 |
|-----|------|
| `initLineMovement(...)` | 初始化直线子弹 |
| `initTraceMovement(...)` | 初始化追踪子弹 |
| `configureCollision(...)` | 配置实时/间隔、轨迹/范围、排序、排重/重复、命中计数等碰撞策略 |
| `getCasterId()` | 获取施法者 ID |

---

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
