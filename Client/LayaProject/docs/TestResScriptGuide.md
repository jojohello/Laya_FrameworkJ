# test_res.ts 使用指南

## 概述

`test_res.ts` 是一个完整的资源管理器测试脚本，可以挂载到 LayaAir 场景上直接使用，无需修改主流程代码。

---

## 快速开始

### Step 1: 在 LayaAir IDE 中创建测试场景

1. 打开 LayaAir IDE
2. 创建新场景（File → New → Scene 2D）
3. 命名为 `TestScene.ls`
4. 保存到 `assets/` 目录

### Step 2: 挂载测试脚本

1. 在场景层级中选择根节点
2. 在属性面板中点击 "添加组件"
3. 选择 `test_res` 脚本
4. 配置参数（可选）：
   - `testImageUrl`: 测试图片路径（默认 `res/test.png`）
   - `showTip`: 是否显示提示文本（默认 `true`）

### Step 3: 准备测试资源

复制一张测试图片到项目资源目录：
```
Client/LayaProject/res/test.png
```

### Step 4: 修改启动场景

编辑 `src/GameConfig.ts`：
```typescript
static startScene: any = "TestScene.ls"; // 改为你的测试场景
```

### Step 5: 运行测试

```bash
npm run dev
```

---

## 操作说明

### 键盘操作

- **A 键**: 创建图片（通过 ResourceMgr 动态加载）
- **C 键**: 清空所有图片（回收到对象池）

### 观察日志

打开浏览器控制台，可以看到：
```
[test_res] 🧪 资源测试脚本启动
[test_res] 初始化 ManagerHub 和 ResourceMgr...
[test_res] ✅ ManagerHub 初始化成功
[test_res] 启动 ManagerHub update 循环
[test_res] 注册键盘事件
[test_res] ✅ 初始化完成
```

按 A 键后：
```
[test_res] 开始加载图片...
  - 路径: res/test.png
[test_res] ✅ 图片创建成功
  - 当前数量: 1
  - 引用计数: 1
  - 对象池缓存数: 0
```

---

## 功能说明

### 自动初始化

脚本会自动完成以下初始化：

1. **ManagerHub 初始化**
   ```typescript
   ManagerHub.instance.register(ResourceMgr.instance);
   ManagerHub.instance.init();
   ```

2. **启动 Update 循环**
   ```typescript
   Laya.timer.frameLoop(1, this, this.onUpdateFrame);
   ```

3. **注册键盘事件**
   ```typescript
   Laya.stage.on(Laya.Event.KEY_DOWN, this, this.onKeyDown);
   ```

### 资源管理测试

- **动态加载**: 使用 `ResourceMgr.instance.load()` 加载图片
- **引用计数**: 自动管理，可通过日志查看
- **对象池**: 回收的资源会进入对象池复用
- **延迟销毁**: 5秒后自动释放未使用的资源

### 自动清理

当场景关闭时，脚本会自动：
1. 回收所有创建的图片
2. 移除事件监听
3. 停止 update 循环
4. 释放 ManagerHub 资源

---

## 属性配置

### testImageUrl（测试图片路径）

**类型**: `String`  
**默认值**: `"res/test.png"`

可以在 IDE 属性面板中修改为其他图片路径。

### showTip（显示提示文本）

**类型**: `Boolean`  
**默认值**: `true`

设为 `false` 可隐藏提示文本。

---

## 调试方法

脚本提供了一些公开方法，可以在 IDE 或代码中调用：

### manualCreateImage()

手动创建一张图片：
```typescript
const script = this.owner.getComponent(test_res);
await script.manualCreateImage();
```

### manualClearImages()

手动清空所有图片：
```typescript
const script = this.owner.getComponent(test_res);
script.manualClearImages();
```

### printResourceStatus()

打印当前资源状态：
```typescript
const script = this.owner.getComponent(test_res);
script.printResourceStatus();
```

输出示例：
```
[test_res] ========== 资源状态 ==========
  - 图片数量: 3
  - 引用计数: 3
  - 对象池缓存: 0
  - 加载状态: Loaded
=======================================
```

---

## 完整流程示例

```bash
# 1. 创建测试场景
# 在 LayaAir IDE 中创建 TestScene.ls

# 2. 挂载脚本
# 在场景根节点添加 test_res 组件

# 3. 准备资源
cp /path/to/image.png Client/LayaProject/res/test.png

# 4. 修改启动场景
# 编辑 GameConfig.ts: static startScene = "TestScene.ls"

# 5. 启动项目
npm run dev

# 6. 测试操作
# - 按 A 创建图片（可多次按）
# - 观察引用计数变化
# - 按 C 清空图片
# - 观察对象池缓存
```

---

## 验证内容

使用此脚本可以验证：

✅ **ResourceMgr 初始化**
- ManagerHub 正确注册
- Update 循环正常运行

✅ **资源加载**
- 动态加载图片成功
- 资源路径正确解析

✅ **引用计数**
- 创建图片时引用计数 +1
- 回收图片时引用计数 -1

✅ **对象池复用**
- 回收的资源进入对象池
- 再次加载时从对象池获取

✅ **延迟销毁**
- 引用计数为 0 的资源 5 秒后释放

✅ **内存管理**
- 场景关闭时资源正确清理
- 无内存泄漏

---

## 常见问题

### Q: 图片加载失败？

A: 检查以下几点：
1. 图片资源是否存在：`res/test.png`
2. 路径是否正确（相对于项目根目录）
3. 图片格式是否支持（png/jpg/webp）

### Q: 按键无响应？

A: 确保：
1. 浏览器窗口获得焦点
2. 在控制台中查看是否有错误
3. 检查 Laya.stage 是否正常

### Q: 引用计数不准确？

A: 可能原因：
1. 图片被其他地方引用
2. 未正确调用 `recoverRes()`
3. 资源还在延迟销毁队列中

---

## 对比说明

### test_res.ts vs ResourceTestScene vs TestSceneMain

| 特性 | test_res.ts | ResourceTestScene | TestSceneMain |
|------|------------|-------------------|---------------|
| **使用方式** | 挂载到场景 | 代码创建 | 代码创建 |
| **IDE 友好** | ✅ 可视化配置 | ❌ 纯代码 | ❌ 纯代码 |
| **初始化** | ✅ 自动完成 | ❌ 需手动 | ✅ 自动完成 |
| **清理** | ✅ 自动清理 | ✅ 自动清理 | ✅ 自动清理 |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

**创建时间**: 2026-01-21  
**维护者**: jojohello  
**相关文档**: [ResourceManager 设计文档](../logic/resource/DESIGN.md)
