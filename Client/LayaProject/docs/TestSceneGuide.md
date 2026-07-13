# 独立测试场景使用指南

## 概述

使用独立的测试场景来测试 ResourceManager 等功能，不需要修改主流程代码，通过切换启动场景来选择测试/正式环境。

---

## 快速开始

### Step 1: 修改启动场景

编辑 `src/GameConfig.ts`：

```typescript
export default class GameConfig {
    // ... 其他配置 ...
    
    // 🧪 测试模式：使用 TestSceneMain
    static startScene: any = "TestSceneMain";
    
    // 正常模式：使用 start.ls
    // static startScene: any = "start.ls";
}
```

### Step 2: 启动项目

```bash
cd Client/LayaProject
npm run dev
```

### Step 3: 测试操作

- ⌨️ 按 **A** 键：创建图片（验证资源加载和引用计数）
- ⌨️ 按 **C** 键：清空图片（验证资源回收）
- 👀 观察控制台日志

---

## 文件说明

### TestSceneMain.ts

**位置**: `src/logic/TestSceneMain.ts`

**功能**：
- ✅ 独立的测试场景入口
- ✅ 初始化 ResourceMgr
- ✅ 启动 ManagerHub 的 update 循环
- ✅ 创建 ResourceTestScene

**代码片段**：
```typescript
export class TestSceneMain extends Laya.Scene {
    onEnable(): void {
        // 初始化 ResourceMgr
        ManagerHub.instance.register(ResourceMgr.instance);
        ManagerHub.instance.init();
        
        // 创建测试场景
        const testScene = new ResourceTestScene();
        this.addChild(testScene);
    }
}
```

### ResourceTestScene.ts

**位置**: `src/logic/ResourceTestScene.ts`

**功能**: 资源管理器测试场景
- 按 A 键创建图片
- 按 C 键清空图片
- 显示引用计数信息

---

## 切换测试/正式环境

### 方式 1：修改 GameConfig.ts（推荐）

```typescript
// 测试环境
static startScene: any = "TestSceneMain";

// 正式环境
static startScene: any = "start.ls";
```

### 方式 2：使用条件判断

```typescript
static startScene: any = 
    process.env.NODE_ENV === 'test' 
    ? "TestSceneMain" 
    : "start.ls";
```

### 方式 3：使用配置文件

创建 `src/TestConfig.ts`：
```typescript
export const TestConfig = {
    useTestScene: true // 改为 false 恢复正常
};
```

在 `GameConfig.ts` 中：
```typescript
import { TestConfig } from "./TestConfig";

static startScene: any = 
    TestConfig.useTestScene 
    ? "TestSceneMain" 
    : "start.ls";
```

---

## 优势对比

### 独立测试场景方案 ✅

**优点**：
- ✅ 不修改主流程代码（StartMain.ts）
- ✅ 测试场景完全独立
- ✅ 符合 LayaAir 使用习惯
- ✅ 可以在 IDE 中直接管理

**缺点**：
- ⚠️ 需要手动修改 GameConfig.ts

### TEST_MODE 方案 ❌（已废弃）

**优点**：
- 可以在代码中动态切换

**缺点**：
- ❌ 污染主流程代码
- ❌ 增加 StartMain 复杂度
- ❌ 不符合职责单一原则

---

## 创建自定义测试场景

### 示例：UI 测试场景

1. **创建测试场景类**：

```typescript
// src/logic/UITestSceneMain.ts
export class UITestSceneMain extends Laya.Scene {
    onEnable(): void {
        console.log("[UITestSceneMain] UI 测试场景启动");
        
        // 初始化 UIMgr
        ManagerHub.instance.register(UIMgr.instance);
        ManagerHub.instance.init();
        
        // 创建 UI 测试内容
        this.createTestUI();
    }
    
    private createTestUI(): void {
        // 你的 UI 测试逻辑
    }
}
```

2. **修改启动场景**：

```typescript
static startScene: any = "UITestSceneMain";
```

---

## 注意事项

1. **ManagerHub 初始化**
   - 测试场景需要手动初始化需要的 Manager
   - 记得在 `onDisable` 中释放资源

2. **不要提交测试配置**
   - 提交代码前记得改回 `start.ls`
   - 或在 `.gitignore` 中忽略测试配置

3. **测试资源准备**
   - 确保测试图片资源存在：`res/test.png`
   - 或修改 ResourceTestScene 中的图片路径

---

## 常见问题

### Q: 为什么选择独立测试场景？

A: 独立测试场景不会修改主流程代码，测试和正式环境完全隔离，更安全、更清洁。

### Q: 如何快速切换测试/正式？

A: 在 GameConfig.ts 中注释/取消注释一行即可：
```typescript
static startScene: any = "TestSceneMain"; // 测试
// static startScene: any = "start.ls";     // 正式
```

### Q: 可以创建多个测试场景吗？

A: 可以！参考 TestSceneMain 创建更多测试场景，然后在 GameConfig 中切换。

---

## 示例：完整工作流程

```bash
# 1. 修改启动场景为测试模式
# 编辑 GameConfig.ts: static startScene: any = "TestSceneMain";

# 2. 准备测试资源
# 复制图片到 res/test.png

# 3. 启动项目
npm run dev

# 4. 测试功能
# - 按 A 键创建图片
# - 按 C 键清空图片
# - 检查控制台日志

# 5. 完成测试后恢复正常
# 编辑 GameConfig.ts: static startScene: any = "start.ls";
```

---

**创建时间**: 2026-01-21  
**维护者**: jojohello
