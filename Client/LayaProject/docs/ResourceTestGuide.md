# 资源管理器测试指南

## 问题说明

你遇到的错误是因为 `ManagerHub` 和 `ResourceMgr` 位于 `logic` 分包中，而你的测试脚本在 `src/script/` 文件夹中。由于 LayaAir 的分包机制，`logic` 分包在运行时可能还未加载，导致这些类未定义。

## 解决方案

项目中已经有一个正确的测试场景实现，位于 `src/logic/` 文件夹中：

### 方法 1：使用现有的测试场景（推荐）

1. **修改 GameConfig.ts 启动场景**

   打开 `src/GameConfig.ts`，将第 13 行修改为：
   ```typescript
   static startScene:any="TestSceneMain.ls";
   ```

2. **运行项目**
   
   现在启动项目将直接进入资源测试场景

3. **测试操作**
   - 按 **A 键**：创建图片（使用 ResourceMgr 加载）
   - 按 **C 键**：清空所有图片（回收到对象池）

4. **恢复正常启动**
   
   测试完成后，将 GameConfig.ts 改回：
   ```typescript
   static startScene:any="start.ls";
   ```

### 方法 2：在 LayaAir IDE 中创建测试场景

如果你想在 IDE 中创建一个可视化的测试场景：

1. **在 IDE 中创建新场景**
   - 场景名称：`TestResScene.ls`
   - 位置：放在 `assets` 文件夹下

2. **添加测试脚本**
   - 将 `src/logic/test/test_res.ts` 脚本拖拽到场景的根节点上
   - 注意：必须使用 `logic/test/test_res.ts`，不要使用 `script/test_res.ts`

3. **配置脚本属性**
   - `testImageUrl`: "startupUI/login/imgs/btn_bg_blue.png"
   - `showTip`: true

4. **运行场景**
   - 在 IDE 中直接运行该场景
   - 或者修改 GameConfig.ts 的 startScene 为你的场景名

## 重要说明

### 资源路径规则

LayaAir 的资源路径**不需要**包含 "assets" 前缀：

❌ 错误：`"assets/startupUI/login/imgs/btn_bg_blue.png"`  
✅ 正确：`"startupUI/login/imgs/btn_bg_blue.png"`

### 文件位置说明

- ✅ **正确的测试脚本**：`src/logic/test/test_res.ts`（与 ManagerHub 在同一分包）
- ❌ **错误的测试脚本**：`src/script/test_res.ts`（会导致 ManagerHub 未定义错误）

### 现有测试文件

项目中已有以下测试文件，都在 `src/logic/` 文件夹中：

1. **TestSceneMain.ts** - 测试场景入口（初始化 ManagerHub）
2. **ResourceTestScene.ts** - 资源测试场景（键盘操作）
3. **test/test_res.ts** - Laya.Script 版本的测试脚本

## 快速开始

最简单的方式：

```typescript
// 1. 修改 src/GameConfig.ts
static startScene:any="TestSceneMain.ls";

// 2. 运行项目

// 3. 按 A 键创建图片，按 C 键清空
```

## 调试信息

测试时会在控制台输出以下信息：
- 图片加载状态
- 引用计数
- 对象池缓存数量
- 加载状态（UNLOAD/LOADING/LOADED）

## 常见问题

**Q: 为什么不能使用 `src/script/test_res.ts`？**  
A: 因为 `ManagerHub` 和 `ResourceMgr` 在 `logic` 分包中，script 文件夹的脚本在分包加载前就会执行，导致这些类未定义。

**Q: 如何切换回正常启动？**  
A: 修改 `GameConfig.ts` 的 `startScene` 为 `"start.ls"`

**Q: 图片路径应该怎么写？**  
A: 相对于 `assets` 文件夹，不需要包含 "assets" 前缀。例如：`"startupUI/login/imgs/btn_bg_blue.png"`
