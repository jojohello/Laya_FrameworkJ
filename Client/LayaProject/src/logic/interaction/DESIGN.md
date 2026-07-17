# 世界交互与 UI 分层设计

本文件记录场景对象点击、世界空间提示、屏幕浮层和模态窗口的统一方案。涉及 Sprite 点击、场景对象弹窗、关卡节点交互、NPC/宝箱/小兵交互时，必须先读取本文件。

## 核心决策

可点击对象不要求全部使用 G 系列 UI 组件。对象属于世界坐标还是屏幕坐标，决定它的实现方式：

| 类型 | 典型对象 | 实现层和组件 |
|------|----------|--------------|
| 屏幕 UI | 主界面按钮、背包按钮、弹窗按钮 | GButton/GImage/GBox，挂到 UI 层 |
| 世界对象 | 关卡节点、小兵、建筑、宝箱 | Sprite/SceneObj/场景 prefab |
| 世界提示 | 小兵名字、血条、选中圈 | WorldUI，跟随世界坐标和相机 |
| 屏幕浮层 | 主界面活动入口、常驻提示 | UnderMainUI，屏幕坐标，位于 MainUI 下方 |
| 模态窗口 | 小兵详情、奖励确认、复杂信息 | DialogMgr/Pop 层，带 mask 并阻断背景点击 |

Sprite 交互必须显式处理：

1. 设置 `mouseEnabled = true`。
2. 对透明或非规则图形设置 `hitArea`。
3. 检查所有父节点的鼠标属性和 `mouseThrough`。
4. 场景使用 Camera2D 时，检查 Camera2D 是否竞争鼠标命中。
5. 地图拖拽场景必须区分点击和拖动，建议移动距离小于 12 像素才视为点击。

## 层级约定

## Click plane and blocking rules

The project does not have a rule that only one layer may ever be clickable. The actual rule is:

- In the same screen region, only the intended topmost layer may be a blocking hit target.
- A full-screen node with `mouseEnabled = true` and `mouseThrough = false` blocks hit testing of lower sibling layers.
- Multiple layers may be clickable when their hit regions do not overlap, or when upper container nodes are transparent to mouse hit testing.
- World objects and stage nodes belong in `Ground` or `Object`; they must not be added to `Hud`.
- `Hud` is currently a reserved empty layer. It must use `mouseEnabled = false` and `mouseThrough = true`.
- Screen UI belongs under `GRoot`/`MainUI`; modal dialogs are the only intended full-screen blocking layer and must use their own mask.

The current display order is therefore a hit-test order as well as a render order:

```text
screen modal mask (temporary, blocks background)
screen UI controls (only their own regions block)
MainUI shell (empty regions pass through)
Hud (reserved, non-interactive)
Object / Ground (world interaction)
```

### Scene layer topology

`LayerMgr` owns the complete direct scene-layer structure. The scene root must not contain a generic `Scene` or `AboveScene` container with another `SceneLayer_*` hierarchy beneath it. New scene layers are added to `LayerMgr.SCENE_LAYER_NAMES`, assigned a zOrder in `LayerMgr`, and mapped directly by `SceneLayerNames`.

The required topology is:

```text
SceneRoot
├── BelowScene
├── Background
├── Ground
├── Object
├── Bullet
├── Effect
├── Hud
└── Debug
```

`BaseScene` only references these existing direct nodes and must not create per-scene child layer containers. This keeps layer lookup and hit testing shallow, makes the zOrder explicit, and prevents an empty full-screen child layer from accidentally becoming an input blocker.

### GRoot and passive observation

Do not register a diagnostic `CLICK` listener directly on `GRoot`. In LayaAir 3.3, registering a mouse listener automatically enables mouse input on that node; this can turn GRoot into the blocking hit target and break both login controls and world-object clicks. Use a Stage-level observer or an explicit interaction router instead. Never globally set `GRoot.mouseEnabled = false` as a scene workaround, because that also disables login and other UI controls.

### Debugging checklist for blocked world clicks

1. Confirm the prefab is loaded and the runtime hotspot binding log exists.
2. Log `MOUSE_DOWN` and `MOUSE_UP` target names and coordinates at Stage level.
3. If the target is `Hud`, `MainUI`, or another full-screen container, inspect that node's `mouseEnabled`, `mouseThrough`, `hitTestPrior`, and child attachments.
4. Remove the unexpected child from the blocking layer before changing the hotspot implementation.
5. After structural layer edits, inspect the affected scene lifecycle method (`onEnter`, `onUpdate`, `create...`) to ensure initialization calls such as `createStageControls()` were not accidentally commented out or moved behind an early return.
6. Re-run TypeScript compilation and verify: prefab loaded, hotspot bound, pointer target, stage click, and route transition.

```text
Laya.stage
├── SceneRoot
│   ├── BelowScene
│   ├── Scene
│   │   ├── Ground
│   │   ├── Object
│   │   └── WorldUI
│   └── AboveScene
└── GRoot
    ├── UnderMainUI      z=80
    ├── MainUI           z=100
    ├── UIWindow         z=200
    ├── Pop              z=400
    └── Top              z=700
```

`UnderMainUI` 只用于屏幕坐标下、需要位于主界面壳层下面的 prefab。跟随小兵或地图移动的内容必须放在 `WorldUI` 或世界对象层，不得把世界弹窗直接放到 `UnderMainUI`。

## 交互边界

场景对象的点击逻辑不能直接散落在对象脚本中调用 `SceneMgr` 或 `UIManager`。成熟方案是统一交互路由：

```text
Sprite/SceneObj 点击
        ↓
WorldInteractionMgr
        ↓
统一交互事件（type + id + worldPosition）
        ↓
InteractionRouteRegistry
        ↓
场景切换、WorldPopupMgr 或 DialogMgr
```

推荐使用稳定路由键，不在配置表中写 TypeScript 类名或方法名：

```text
battle.enter
creature.inspect
creature.detail
chest.open
npc.talk
```

一个可交互对象至少应能提供：

```typescript
interface IWorldInteractable {
    readonly interactableId: number | string;
    readonly interactableType: string;
    getWorldPosition(): Laya.Point;
    onInteract(): void;
}
```

## 世界对象弹窗

点击小兵、NPC、宝箱等对象时，先区分两种 UI：

### 世界空间浮窗

例如小兵头顶的小信息框：

- prefab 挂到 `WorldUI`。
- 以目标世界坐标为锚点。
- 目标移动时同步位置。
- 每帧进行屏幕边界修正。
- 目标销毁、切换对象或场景退出时关闭。

### 屏幕空间详情窗口

例如完整小兵属性窗口：

- 由 `DialogMgr` 创建。
- 挂到 Pop 层。
- 使用半透明 mask。
- 阻断背景交互。
- 关闭时通过回调恢复原场景状态。

世界对象只提供 ID 和必要的空间信息，详情数据由对应的业务 Manager 或服务器初始化数据提供，不能把完整业务数据硬编码到 prefab。

## prefab 责任

Prefab 只负责视觉结构和默认布局：

- 图片、Sprite、尺寸、锚点。
- 文本占位节点。
- 选中圈、血条锚点、弹窗锚点。

运行时代码负责：

- 绑定配置和业务 ID。
- 设置资源和状态。
- 创建点击热区。
- 注册/注销交互事件。
- 发起稳定 routeKey。
- 管理弹窗和场景生命周期。

## AI 辅助开发流程

以后提出类似需求时，使用下面的请求格式：

```text
请先读取 src/logic/interaction/DESIGN.md。
对象类型：世界对象/屏幕 UI/世界浮窗/模态窗口。
对象所在坐标系：世界坐标/屏幕坐标。
是否有相机拖拽：是/否。
Prefab 路径：...
对象 ID 来源：配置表字段或服务器数据字段。
点击后的 routeKey：...
弹窗类型：WorldUI 浮窗/DialogMgr 模态窗口。
请先检查现有层级、生命周期和资源，再给出把握度；超过 95% 后实施。
```

AI 执行前必须完成：

1. 读取本文件和目标模块沿途的 `DESIGN.md`、`README.md`、必要的 `PlanAndStatus.md`。
2. 确认对象属于世界坐标还是屏幕坐标。
3. 确认 prefab 节点类型是 Sprite 还是 G 系列组件。
4. 检查 `mouseEnabled`、`mouseThrough`、`hitArea`、父层和 Camera2D。
5. 先确定交互路由和关闭/销毁路径，再写点击代码。
6. 编译后必须在 LayaAir IDE 中验证点击、拖动、场景切换、重复进入和退出。

## 验收清单

- 点击对象能够输出对象类型和 ID。
- 点击和地图拖动不会互相误触发。
- 世界浮窗跟随相机和目标对象移动。
- 屏幕模态窗口有 mask 且阻断背景点击。
- 场景退出后对象、事件、Timer 和 popup 全部释放。
- 重复进入场景不会重复注册事件或创建节点。
- 配置只使用稳定 ID、routeKey 和资源路径，不直接绑定类名和方法名。
