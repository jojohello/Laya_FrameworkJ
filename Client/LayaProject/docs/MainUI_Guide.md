# MainUI 创建指南

> 本文档说明如何创建游戏主界面（MainUI）来验证 UIManager 功能

---

## 📝 创建步骤

### Step 1: 在 LayaAir IDE 中创建场景

1. 打开 LayaAir IDE
2. 在 `assets/` 目录下创建 `ui/main/` 文件夹
3. 创建新场景：`mainUI.ls`
4. 添加 UI 组件：
   - 根节点：Scene（名称：MainUI）
   - 添加几个测试按钮：
     - `btnBag`（背包按钮）
     - `btnShop`（商店按钮）
     - `btnSetting`（设置按钮）
     - `btnClose`（关闭按钮）
5. 为需要访问的节点勾选 `_$var` 选项
6. 为根节点设置 Runtime Class（指向 `MainUI.ts`）

### Step 2: 创建 MainUI 脚本

创建文件：`src/ui/main/MainUI.ts`

```typescript
const { regClass } = Laya;

/**
 * 游戏主界面
 * 用于验证 UIManager 功能
 */
@regClass()
export class MainUI extends MainUIBase {  // MainUIBase 由 IDE 自动生成

    // ========== 生命周期 ==========

    onAwake(): void {
        console.log("[MainUI] onAwake");
    }

    onEnable(): void {
        console.log("[MainUI] onEnable");
        this.registerEvents();
    }

    onDisable(): void {
        console.log("[MainUI] onDisable");
        this.unregisterEvents();
    }

    onDestroy(): void {
        console.log("[MainUI] onDestroy");
    }

    // ========== 框架方法（UIManager 调用）==========

    /**
     * UI 打开时调用
     */
    onOpened(param?: any): void {
        console.log("[MainUI] onOpened, param:", param);
        this.playEnterAnimation();
    }

    /**
     * UI 关闭时调用
     */
    onClosed(): void {
        console.log("[MainUI] onClosed");
    }

    // ========== 事件管理 ==========

    private registerEvents(): void {
        // 注册按钮事件
        this.btnBag?.on(Laya.Event.CLICK, this, this.onBagClick);
        this.btnShop?.on(Laya.Event.CLICK, this, this.onShopClick);
        this.btnSetting?.on(Laya.Event.CLICK, this, this.onSettingClick);
        this.btnClose?.on(Laya.Event.CLICK, this, this.onCloseClick);
    }

    private unregisterEvents(): void {
        // 移除按钮事件
        this.btnBag?.off(Laya.Event.CLICK, this, this.onBagClick);
        this.btnShop?.off(Laya.Event.CLICK, this, this.onShopClick);
        this.btnSetting?.off(Laya.Event.CLICK, this, this.onSettingClick);
        this.btnClose?.off(Laya.Event.CLICK, this, this.onCloseClick);
    }

    // ========== 按钮事件处理 ==========

    private onBagClick(): void {
        console.log("[MainUI] 点击背包按钮");
        // 打开背包（如果配置了互斥，会自动关闭商店）
        UIManager.instance.open("BagUI");
    }

    private onShopClick(): void {
        console.log("[MainUI] 点击商店按钮");
        // 打开商店（如果配置了互斥，会自动关闭背包）
        UIManager.instance.open("ShopUI");
    }

    private onSettingClick(): void {
        console.log("[MainUI] 点击设置按钮");
        UIManager.instance.open("SettingUI");
    }

    private onCloseClick(): void {
        console.log("[MainUI] 点击关闭按钮");
        // 关闭主界面
        UIManager.instance.close("MainUI");
    }

    // ========== 动画 ==========

    playEnterAnimation(complete?: Function): void {
        // 使用 UIHelper 提供的缩放弹出动画
        UIHelper.scalePopIn(this.owner, 300, complete);
    }

    playExitAnimation(complete?: Function): void {
        // 使用 UIHelper 提供的缩放收起动画
        UIHelper.scalePopOut(this.owner, 200, complete);
    }
}
```

### Step 3: 在 UIConfigTable 中注册

编辑 `src/logic/ui/UIConfigTable.ts`：

```typescript
export const UIConfigTable: { [name: string]: any } = {
    // ... 其他配置

    // 主界面
    "MainUI": {
        path: "ui/main/mainUI.ls",
        layer: UILayer.Normal,
        singleton: true,        // 单例
        autoDestroy: false,     // 缓存复用
        mutex: []               // 不与其他 UI 互斥
    },

    // 背包界面（示例）
    "BagUI": {
        path: "ui/bag/bagUI.ls",
        layer: UILayer.Normal,
        singleton: true,
        autoDestroy: false,
        mutex: ["ShopUI"]       // 与商店互斥
    },

    // 商店界面（示例）
    "ShopUI": {
        path: "ui/shop/shopUI.ls",
        layer: UILayer.Normal,
        singleton: true,
        autoDestroy: false,
        mutex: ["BagUI"]        // 与背包互斥
    }
};
```

### Step 4: 在游戏启动时打开

编辑 `src/logic/LogicMain.ts` 或其他启动文件：

```typescript
import { UIManager } from "./ui/UIManager";

export class LogicMain {
    async start(): Promise<void> {
        // ... 其他初始化

        // 打开主界面
        await UIManager.instance.open("MainUI", { fromLogin: true });
    }
}
```

---

## 🧪 测试验证

### 验证点 1: 单例功能

```typescript
// 多次打开主界面，应该只有一个实例
await UIManager.instance.open("MainUI");
await UIManager.instance.open("MainUI");  // 不会创建新实例

console.log(UIManager.instance.isOpened("MainUI"));  // true
```

### 验证点 2: 互斥功能

```typescript
// 打开背包，商店应自动关闭
await UIManager.instance.open("BagUI");
console.log(UIManager.instance.isOpened("BagUI"));   // true
console.log(UIManager.instance.isOpened("ShopUI"));  // false

// 打开商店，背包应自动关闭
await UIManager.instance.open("ShopUI");
console.log(UIManager.instance.isOpened("BagUI"));   // false
console.log(UIManager.instance.isOpened("ShopUI"));  // true
```

### 验证点 3: 缓存复用

```typescript
// 关闭主界面（不销毁，缓存）
UIManager.instance.close("MainUI");
console.log(UIManager.instance.isOpened("MainUI"));  // false

// 再次打开（从缓存中恢复，秒开）
await UIManager.instance.open("MainUI");  // 快速打开
```

### 验证点 4: 资源引用计数

打开开发者控制台，观察日志：

```
[ResourceMgr] addRef: ui/main/mainUI.ls, refCount: 1
[UIManager] UI already opened (singleton): MainUI
[ResourceMgr] releaseRef: ui/main/mainUI.ls, refCount: 0
```

---

## 📝 注意事项

1. **路径规范**：配置中的 `path` 不要包含 `assets/` 前缀
2. **Runtime Class**：在 IDE 中必须正确设置 Runtime Class
3. **@regClass()**：TypeScript 类必须添加 `@regClass()` 装饰器
4. **节点引用**：需要访问的节点必须勾选 `_$var` 选项

---

## 🔗 相关文档

- [UIManager 使用文档](../ui/README.md)
- [资源管理器文档](../resource/README.md)
- [客户端开发指南](../../CLAUDE.md)

---

**创建者**: jojohello | **日期**: 2026-01-22
