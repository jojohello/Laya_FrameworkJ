# 测试模式使用指南

## 功能说明

测试模式允许你跳过登录流程，直接运行单机测试场景，非常适合开发和调试 UI、资源管理器等不需要网络连接的功能。

---

## 快速开始

### 方式 1：使用配置文件（推荐）

1. **修改测试配置**：

编辑 `src/TestModeConfig.ts`：

```typescript
export const enableTestMode = () => {
    StartMain.TEST_MODE = true; // 开启测试模式
    StartMain.TEST_SCENE_PATH = ""; // 留空使用默认 ResourceTestScene
};
```

2. **在入口文件中调用**：

```typescript
import { StartMain } from "./start/StartMain";
import { enableTestMode } from "./TestModeConfig";

// 开启测试模式
enableTestMode();

// 启动游戏
const startMain = new StartMain();
startMain.start();
```

### 方式 2：直接设置（快速）

在项目入口文件中：

```typescript
import { StartMain } from "./start/StartMain";

// 🧪 开启测试模式
StartMain.TEST_MODE = true;

// 启动游戏
const startMain = new StartMain();
startMain.start();
```

---

## 配置选项

### `StartMain.TEST_MODE`

**类型**: `boolean`  
**默认值**: `false`

- `true`: 跳过登录流程，直接运行测试场景
- `false`: 正常登录流程

### `StartMain.TEST_SCENE_PATH`

**类型**: `string`  
**默认值**: `""`

指定要加载的测试场景路径：

- **留空** (`""`): 自动创建 `ResourceTestScene`（资源管理器测试场景）
- **指定路径**: 加载指定的 `.ls` 场景文件

**示例**：

```typescript
// 使用默认测试场景
StartMain.TEST_MODE = true;
StartMain.TEST_SCENE_PATH = "";

// 使用自定义测试场景
StartMain.TEST_MODE = true;
StartMain.TEST_SCENE_PATH = "logic/ui/MyTestScene.ls";
```

---

## 测试场景说明

### 默认测试场景：ResourceTestScene

**功能**：测试资源管理器（ResourceManager）

**操作**：
- 按 `A` 键：创建图片并动态加载
- 按 `C` 键：清空所有图片

**验证内容**：
- ✅ 引用计数机制
- ✅ 对象池复用
- ✅ 延迟销毁

**代码位置**: `src/logic/ResourceTestScene.ts`

---

## 使用场景

### 场景 1：开发资源管理器

```typescript
// 开启测试模式，使用默认 ResourceTestScene
StartMain.TEST_MODE = true;
StartMain.TEST_SCENE_PATH = "";
```

### 场景 2：开发 UI 管理器

```typescript
// 开启测试模式，加载 UI 测试场景
StartMain.TEST_MODE = true;
StartMain.TEST_SCENE_PATH = "logic/ui/UITestScene.ls";
```

### 场景 3：调试特定功能

```typescript
// 开启测试模式，加载自定义测试场景
StartMain.TEST_MODE = true;
StartMain.TEST_SCENE_PATH = "logic/debug/MyDebugScene.ls";
```

---

## 恢复正常流程

将测试模式关闭即可：

```typescript
StartMain.TEST_MODE = false; // 恢复正常登录流程
```

或者注释掉 `enableTestMode()` 的调用。

---

## 注意事项

1. **不要在生产环境开启测试模式**
   - 测试模式会跳过登录和网络连接
   - 只适合本地开发和调试

2. **测试场景路径**
   - 确保场景文件存在
   - 路径相对于项目资源根目录

3. **LogicMain 仍会初始化**
   - 测试模式下 LogicMain 会正常初始化
   - 但不会启动网络连接（不调用 `startCoreFlow()`）

---

## 工作流程对比

### 正常模式流程

```
启动游戏
  ↓
初始化引擎
  ↓
初始化网络管理器
  ↓
显示登录界面
  ↓
用户登录
  ↓
连接 Gateway
  ↓
加载 Logic 分包
  ↓
进入游戏
```

### 测试模式流程

```
启动游戏
  ↓
检测到 TEST_MODE = true
  ↓
初始化引擎
  ↓
初始化层级管理器
  ↓
加载 Logic 分包
  ↓
初始化 LogicMain
  ↓
直接打开测试场景 ✅
```

---

## 示例代码

完整的入口文件示例：

```typescript
// Main.ts
import { StartMain } from "./start/StartMain";

// 🧪 开发时开启测试模式
// 提交代码前记得改回 false
StartMain.TEST_MODE = true;

// 启动游戏
const startMain = new StartMain();
startMain.start();
```

---

**最后更新**: 2026-01-21  
**维护者**: jojohello
