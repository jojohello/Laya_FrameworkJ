# UIManager 使用文档

> **版本**: 2.0（配置表驱动 - 纯对象模式）
> **最后更新**: 2026-01-22

---

## 📚 快速开始

### 1. 在配置表中添加 UI

直接在 [UIConfigTable.ts](UIConfigTable.ts) 中添加配置（像 JSON 一样）：

```typescript
export const UIConfigTable: { [name: string]: any } = {
    "MyUI": {
        path: "ui/myUI.ls",              // 资源路径（相对 assets/）
        layer: UILayer.Normal,           // 层级
        singleton: true,                 // 是否单例
        autoDestroy: false,              // 关闭时是否销毁（false=缓存复用）
        mutex: ["OtherUI"]               // 互斥的 UI（打开时自动关闭）
    }
};
```

### 2. 打开 UI

```typescript
// 简单打开
await UIManager.instance.open("MyUI");

// 带参数打开
await UIManager.instance.open("MyUI", { userId: 123 });
```

### 3. 关闭 UI

```typescript
UIManager.instance.close("MyUI");
```

---

## 🎯 核心概念

### UI 配置字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | string | ✅ | 资源路径（不含 `assets/` 前缀）|
| `layer` | UILayer | ✅ | UI 层级（Bottom/Normal/Pop/Tips/Loading）|
| `singleton` | boolean | ✅ | 是否单例（同时只能打开一个实例）|
| `autoDestroy` | boolean | ✅ | 关闭时是否自动销毁（false=缓存复用）|
| `mutex` | string[] | ⚪ | 互斥的 UI 列表（打开时自动关闭）|
| `zOrder` | number | ⚪ | 同层级内的排序（默认按打开顺序）|
| `controllerClass` | constructor | ⚪ | 为未绑定序列化 Runtime UUID 的 `.ls` 创建独立控制器；构造函数接收场景根节点 |
| 其他字段 | any | ⚪ | 任意自定义字段（灵活扩展）|

---

## 📐 层级系统（UILayer）

| 层级 | 枚举值 | 用途 | 示例 |
|------|--------|------|------|
| **Bottom** | 0 | 底图/场景背景 | 游戏场景背景 |
| **Normal** | 1 | 全屏界面、主界面 | 主界面、背包、商店 |
| **Pop** | 2 | 弹窗、对话框 | 确认框、购买弹窗 |
| **Tips** | 3 | 飘字、提示 | 奖励飘字、Toast |
| **Loading** | 4 | 加载界面（最顶层）| 转圈圈、断线重连 |

---

## 🔧 高级功能

### 1. 单例 vs 多例

**单例 UI**（`singleton: true`）：
- 同时只能打开一个实例
- 重复打开会复用已存在的实例
- 适用于：主界面、背包、设置等

**多例 UI**（`singleton: false`）：
- 可以同时打开多个实例
- 每次打开都创建新实例
- 适用于：奖励飘字、伤害数字等

### 2. 缓存复用（autoDestroy）

**自动销毁**（`autoDestroy: true`）：
- 关闭时立即销毁场景和资源
- 下次打开需要重新加载
- 适用于：低频界面、一次性弹窗

**缓存复用**（`autoDestroy: false`）：
- 关闭时只移除显示，不销毁
- 下次打开直接复用（秒开）
- 适用于：高频界面（背包、商店）

### 3. 互斥功能（mutex）

打开某个 UI 时，自动关闭冲突的 UI：

```typescript
UIConfigTable.register({
    name: "BagUI",
    mutex: ["ShopUI", "SkillUI"]  // 打开背包时，自动关闭商店和技能
});
```

**应用场景**：
- 主界面模块切换（背包、商店、技能互斥）
- 登录/注册界面互斥
- 全屏界面互斥

---

## 💻 UI 脚本开发

### 1. 创建 UI 类

你的 UI 类应该继承 IDE 生成的 Base 类：

```typescript
const { regClass } = Laya;

@regClass()
export class MyUI extends MyUIBase {  // MyUIBase 由 IDE 自动生成

    // ========== 生命周期 ==========

    onAwake(): void {
        // 初始化数据、获取组件引用（只执行一次）
    }

    onEnable(): void {
        // 注册事件、启动定时器（可能多次执行）
        this.myButton.on(Laya.Event.CLICK, this, this.onButtonClick);
    }

    onDisable(): void {
        // 移除事件、清理定时器
        this.myButton.off(Laya.Event.CLICK, this, this.onButtonClick);
    }

    // ========== 框架方法（可选实现）==========

    /**
     * UI 打开时调用（由 UIManager 调用）
     */
    onOpened(param?: any): void {
        console.log("UI opened with param:", param);
        this.playEnterAnimation();
    }

    /**
     * UI 关闭时调用（由 UIManager 调用）
     */
    onClosed(): void {
        console.log("UI closed");
    }

    /**
     * 播放进入动画（可选）
     * 使用 Laya.Tween.to 实现缩放弹出效果
     */
    playEnterAnimation(complete?: Function): void {
        const owner = this.owner as Laya.Sprite;
        owner.scale(0.8, 0.8);
        Laya.Tween.to(owner, { scaleX: 1, scaleY: 1 }, 300, Laya.Ease.backOut, Laya.Handler.create(null, complete));
    }

    /**
     * 播放退出动画（可选）
     * 使用 Laya.Tween.to 实现缩放收起效果
     */
    playExitAnimation(complete?: Function): void {
        const owner = this.owner as Laya.Sprite;
        Laya.Tween.to(owner, { scaleX: 0.8, scaleY: 0.8 }, 200, Laya.Ease.backIn, Laya.Handler.create(null, complete));
    }

    // ========== 业务逻辑 ==========

    private onButtonClick(): void {
        // 关闭当前 UI
        UIManager.instance.close("MyUI");
    }
}
```

### 2. 动画实现（使用 Laya.Tween.to）

```typescript
// 淡入动画
const node = this.owner as Laya.Sprite;
node.alpha = 0;
Laya.Tween.to(node, { alpha: 1 }, 300);

// 淡出动画
Laya.Tween.to(node, { alpha: 0 }, 300);

// 缩放弹出（从 0.8 到 1.0）
node.scale(0.8, 0.8);
Laya.Tween.to(node, { scaleX: 1, scaleY: 1 }, 300, Laya.Ease.backOut);

// 缩放收起（从 1.0 到 0.8）
Laya.Tween.to(node, { scaleX: 0.8, scaleY: 0.8 }, 200, Laya.Ease.backIn);
```

### 3. 事件注册最佳实践

使用 Laya.Script 标准生命周期管理事件：

| 生命周期 | 用途 |
|----------|------|
| `onEnable()` | 注册事件监听、启动定时器 |
| `onDisable()` | 注销事件监听、清理定时器 |
| `onAwake()` | 初始化数据、获取组件引用（只执行一次） |
| `onDestroy()` | 释放资源、清理引用 |

**注意**：不要在 `onAwake` 中注册事件，因为 `onAwake` 只执行一次，而 UI 可能被多次打开/关闭（缓存复用模式）。

---

## 📝 完整开发流程

### Step 1: IDE 中创建 UI 场景

1. 在 LayaAir IDE 中创建 `.ls` 场景文件
2. 使用 G 系列组件（GBox, GImage, GButton 等）
3. 为需要访问的节点勾选 `_$var` 选项
4. 在场景根节点设置 Runtime Class（指向你的 TypeScript 类）

### Step 2: 编写 TypeScript 类

```typescript
const { regClass } = Laya;

@regClass()
export class MyUI extends MyUIBase {
    onOpened(param?: any): void {
        // 初始化 UI
    }
}
```

### Step 3: 在配置表中添加 UI

直接在 [UIConfigTable.ts](UIConfigTable.ts) 中添加：

```typescript
export const UIConfigTable: { [name: string]: any } = {
    "MyUI": {
        path: "ui/myUI.ls",
        layer: UILayer.Normal,
        singleton: true,
        autoDestroy: false
    }
};
```

### Step 4: 使用 UIManager 打开

```typescript
await UIManager.instance.open("MyUI", { data: 123 });
```

---

## 🔍 API 参考

### UIManager.instance.open()

```typescript
await UIManager.instance.open(name: string, param?: any): Promise<any>
```

**功能**：打开 UI

**参数**：
- `name`: UI 名称（在 UIConfigTable 中注册的）
- `param`: 传递给 `onOpened()` 的参数

**返回**：UI 脚本实例

**示例**：
```typescript
let ui = await UIManager.instance.open("BagUI", { tabIndex: 1 });
```

---

### UIManager.instance.close()

```typescript
UIManager.instance.close(name: string): void
```

**功能**：关闭 UI

**参数**：
- `name`: UI 名称

**示例**：
```typescript
UIManager.instance.close("BagUI");
```

---

### UIManager.instance.isOpened()

```typescript
UIManager.instance.isOpened(name: string): boolean
```

**功能**：检查 UI 是否已打开

**示例**：
```typescript
if (UIManager.instance.isOpened("BagUI")) {
    console.log("背包已打开");
}
```

---

### UIManager.instance.getUI()

```typescript
UIManager.instance.getUI(name: string): any
```

**功能**：获取已打开的 UI 脚本实例

**示例**：
```typescript
let bagUI = UIManager.instance.getUI("BagUI");
if (bagUI) {
    bagUI.refreshData();
}
```

---

## ⚠️ 注意事项

主界面底部导航来自 `Config/csv/MainNav.csv`，必须通过配置导出器进入 `config-manifest.json` 后才会被 `ConfigMgr` 加载。`routeArgs` 在 CSV 中保存为 JSON 数组字符串，由 `MainSceneView` 解析后传给路由。

### 1. 资源路径规范

**正确**：
```typescript
path: "ui/myUI.ls"  // ✅ 不要包含 assets/ 前缀
```

**错误**：
```typescript
path: "assets/ui/myUI.ls"  // ❌ 错误
```

### 2. 必须使用 @regClass() 装饰器

```typescript
const { regClass } = Laya;

@regClass()  // ✅ 必须添加
export class MyUI extends MyUIBase {
    // ...
}
```

### 3. 资源管理

- UIManager 已自动管理资源引用计数
- 无需手动调用 `ResourceMgr.releaseRef()`
- 资源在 UI 关闭时自动释放

### 4. 单例 UI 重复打开

如果单例 UI 已打开，再次调用 `open()` 会：
1. 不创建新实例
2. 调用 `onOpened()` 刷新参数
3. 返回已存在的实例

---

## 🎨 最佳实践

### 1. 高频界面使用缓存

```typescript
UIConfigTable.register({
    name: "BagUI",
    autoDestroy: false  // ✅ 缓存复用，秒开
});
```

### 2. 使用互斥管理模块切换

```typescript
UIConfigTable.register({
    name: "BagUI",
    mutex: ["ShopUI", "SkillUI"]  // ✅ 自动关闭其他模块
});
```

### 3. 在 onEnable/onDisable 中管理事件

```typescript
onEnable(): void {
    this.registerEvents();  // ✅ 注册事件
}

onDisable(): void {
    this.unregisterEvents();  // ✅ 移除事件
}
```

### 4. 避免在 constructor 中访问 owner

```typescript
constructor() {
    super();
    // ❌ 不要在这里访问 this.owner
}

onAwake(): void {
    // ✅ 在这里初始化
    this.mySprite = this.owner.getChildByName("sprite");
}
```

---

## 📂 相关文件

- [UIManager.ts](UIManager.ts) - UI 管理器核心实现
- [UIConfigTable.ts](UIConfigTable.ts) - UI 配置表（纯对象）
- [UILayerDef.ts](UILayerDef.ts) - UI 层级定义
- [IUIView.ts](IUIView.ts) - UI 接口 + 辅助工具

---

**维护者**: jojohello | **最后更新**: 2026-01-22
