# 修复 test_res 报错指南

## 问题原因

你遇到的错误：
```
ManagerHub 未定义，请确保 logic 分包已加载
```

这是因为你使用的是 `src/script/test_res.ts`，它试图导入 `logic` 文件夹中的模块，但由于分包机制，这些模块在运行时还未加载。

## 解决方案

### ✅ 正确做法：使用 logic 文件夹中的脚本

1. **删除或忽略** `src/script/test_res.ts`（这个文件会报错）

2. **使用** `src/logic/test/test_res.ts`（这个文件是正确的）

3. **在 LayaAir IDE 中：**
   - 创建一个新场景（或使用现有场景）
   - 将 `logic/test/test_res` 脚本拖拽到场景根节点上
   - 注意：在 IDE 中路径显示为 `logic/test/test_res`，不是 `script/test_res`

### 为什么要这样做？

```
项目结构：
├── src/
│   ├── script/          ❌ 主包，logic 模块未加载
│   │   └── test_res.ts  ❌ 会报错：ManagerHub 未定义
│   │
│   └── logic/           ✅ logic 分包
│       ├── core/
│       │   └── ManagerHub.ts
│       ├── resource/
│       │   └── ResourceMgr.ts
│       └── test/
│           └── test_res.ts  ✅ 正确！与 ManagerHub 在同一分包
```

**关键点：**
- `ManagerHub` 和 `ResourceMgr` 在 `logic` 分包中
- Script 必须与它依赖的模块在**同一分包**中
- `logic/test/test_res.ts` 与 `ManagerHub` 在同一分包，所以能正常工作
- `script/test_res.ts` 不在 logic 分包，所以会报错

## 快速修复步骤

### 步骤 1：确认文件位置

确保你使用的是正确的文件：
```
✅ 正确：src/logic/test/test_res.ts
❌ 错误：src/script/test_res.ts
```

### 步骤 2：在 IDE 中重新挂载脚本

1. 打开你的测试场景
2. 选中根节点
3. 如果挂载了 `script/test_res`，删除它
4. 从项目面板中找到 `logic/test/test_res`
5. 拖拽到根节点上

### 步骤 3：配置脚本属性

在 IDE 的属性面板中：
- `testImageUrl`: "startupUI/login/imgs/btn_bg_blue.png"
- `showTip`: true (勾选)

### 步骤 4：运行测试

运行场景，应该能看到：
```
[test_res] 🧪 资源测试脚本启动
[test_res] 初始化 ManagerHub 和 ResourceMgr...
[test_res] ✅ ManagerHub 初始化成功
[test_res] ✅ 初始化完成
```

## 文件对比

### ❌ 错误的文件（src/script/test_res.ts）

```typescript
// 位置：src/script/test_res.ts
import { ManagerHub } from "../logic/core/ManagerHub";  // ❌ 跨分包导入
import { ResourceMgr } from "../logic/resource/ResourceMgr";  // ❌ 跨分包导入

// 运行时会报错：ManagerHub 未定义
```

### ✅ 正确的文件（src/logic/test/test_res.ts）

```typescript
// 位置：src/logic/test/test_res.ts
import { ManagerHub } from "../core/ManagerHub";  // ✅ 同分包导入
import { ResourceMgr } from "../resource/ResourceMgr";  // ✅ 同分包导入

// 运行正常
```

## 常见问题

### Q: 为什么不能直接修复 script/test_res.ts？

A: 因为 LayaAir 的分包机制，`script` 文件夹在主包中，`logic` 文件夹在 logic 分包中。主包加载时，logic 分包还未加载，所以无法访问 `ManagerHub` 和 `ResourceMgr`。

### Q: 我可以把 ManagerHub 移到 script 文件夹吗？

A: 不建议。`ManagerHub` 和 `ResourceMgr` 是游戏核心逻辑，应该放在 logic 分包中。测试脚本应该跟随被测试的模块。

### Q: 如何知道我挂载的是哪个脚本？

A: 在 IDE 中选中节点，查看属性面板中的脚本路径：
- 如果显示 `script/test_res` → 错误
- 如果显示 `logic/test/test_res` → 正确

## 总结

**一句话解决方案：**
删除 `src/script/test_res.ts`，使用 `src/logic/test/test_res.ts`

**原因：**
Script 必须与它依赖的模块在同一分包中，否则会因为模块未加载而报错。
