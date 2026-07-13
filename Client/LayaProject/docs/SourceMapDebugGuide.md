# Source Map 调试指南

## 问题现象

在 LayaAir IDE 预览模式下，分包代码（LogicLib.js）的错误堆栈显示的是编译后的代码位置，而不是原始的 TypeScript 文件：

```
❌ 错误显示：
at _LogicMain.init (LogicLib.js:97:37)

✅ 期望显示：
at LogicMain.init (LogicMain.ts:30:37)
```

## 原因分析

1. **Source Map 文件存在**: `bin/js/bundles/LogicLib.js.map` ✅
2. **Source Map 引用正确**: LogicLib.js 末尾有 `//# sourceMappingURL=LogicLib.js.map` ✅
3. **Source Map 内容完整**: 包含原始代码和映射信息 ✅
4. **问题**: 浏览器没有正确加载 Source Map ❌

## 解决方案

### 方案1：确保浏览器启用了 Source Map

1. 打开浏览器开发者工具（F12）
2. 点击右上角 ⚙️（设置）图标
3. 确保勾选：
   - ✅ **Enable JavaScript source maps**
   - ✅ **Enable CSS source maps**

### 方案2：刷新浏览器缓存

有时浏览器会缓存旧的 JS 文件但没有缓存新的 Source Map：

1. 打开开发者工具（F12）
2. 右键点击浏览器刷新按钮
3. 选择 **"清空缓存并硬性重新加载"**
4. 或者按 `Ctrl + Shift + R`（Windows）/ `Cmd + Shift + R`（Mac）

### 方案3：检查 Network 标签确认 Source Map 加载

1. 打开开发者工具（F12）
2. 切换到 `Network`（网络）标签
3. 重新加载页面
4. 查找 `LogicLib.js.map` 文件：
   - ✅ 如果状态是 `200`：Source Map 加载成功
   - ❌ 如果状态是 `404`：路径配置错误

### 方案4：修改 tsconfig.json（不推荐，LayaAir 会覆盖）

虽然 LayaAir IDE 会覆盖此设置，但可以尝试：

```json
{
  "compilerOptions": {
    "sourceMap": true,    // ← 改为 true
    "inlineSourceMap": false,
    "inlineSources": false
  }
}
```

**注意**: LayaAir IDE 使用 `BuildSettings.json` 中的 `"sourcesContent": true` 来控制 Source Map，通常不需要修改 tsconfig.json。

### 方案5：使用浏览器的映射覆盖（高级）

如果 Source Map 始终无法自动加载：

1. 打开开发者工具（F12）
2. 切换到 `Sources`（源代码）标签
3. 在左侧文件树中找到 `LogicLib.js`
4. 右键点击文件
5. 选择 **"Add source map..."**
6. 输入 Source Map 的完整路径：
   ```
   http://localhost:18090/js/bundles/LogicLib.js.map
   ```

---

## LayaAir IDE 预览模式的限制

### 当前架构

```
LayaAir IDE 预览服务器（localhost:18090）
  ↓
加载 index.html
  ↓
加载 bundle.js（主包）
  ↓
动态加载 LogicLib.js（分包）
  ↓
自动加载 LogicLib.js.map（Source Map）
```

### 可能的问题

1. **路径问题**: IDE 预览服务器可能没有正确处理分包的 Source Map 路径
2. **缓存问题**: 浏览器缓存了旧的 JS 但没有缓存新的 Source Map
3. **CORS 问题**: Source Map 的跨域请求被阻止（少见）

---

## 临时解决方案：使用 Console.log 调试

如果 Source Map 始终无法工作，可以使用传统的 `console.log` 调试：

```typescript
export class LogicMain {
    init() {
        console.log("[LogicMain.init] 开始初始化");  // ← 添加日志
        console.log("[LogicMain.init] App.init()");
        App.init();

        console.log("[LogicMain.init] 注册 NetworkManager");
        ManagerHub.instance.register(NetworkManager.instance);

        console.log("[LogicMain.init] 注册 LoginMgr");
        ManagerHub.instance.register(LoginMgr.instance);

        // ... 其余代码
    }
}
```

优点：
- ✅ 不依赖 Source Map
- ✅ 可以精确定位代码执行位置
- ✅ 可以输出变量值

缺点：
- ❌ 需要手动添加日志
- ❌ 发布前需要清理日志

---

## 发布版本的 Source Map

### Web 平台

发布到 `release/web/` 时：

- **开发版本**: 包含 Source Map（`bundle-xxxxx.js.map`）
- **生产版本**: 通常不包含 Source Map（减小体积）

如果需要在生产环境调试：

1. 修改 `BuildSettings.json`:
   ```json
   {
     "sourcesContent": true,  // ← 确保为 true
     "web": {
       "includeSourceMaps": true  // ← 添加此配置（如果支持）
     }
   }
   ```

2. 发布时选择 **"开发模式"** 而不是 **"发布模式"**

### 微信小游戏平台

微信小游戏通常**不支持** Source Map 调试，因为：

1. 微信开发者工具有自己的调试器
2. 生产环境不允许 Source Map（安全原因）

**建议**: 在 Web 平台完成主要调试后再发布到微信平台。

---

## 最佳实践

### 开发阶段

1. ✅ 在 **LayaAir IDE 预览模式** 下开发
2. ✅ 确保浏览器启用 Source Map
3. ✅ 使用 `console.log` 辅助调试
4. ✅ 定期清除浏览器缓存

### 发布阶段

1. ✅ 发布到 `release/web/` 测试完整功能
2. ✅ 使用本地 HTTP 服务器测试（不是 IDE 预览）
3. ✅ 生产环境禁用 Source Map（安全 + 体积）

---

## 常见问题

### Q: 为什么主包（bundle.js）的 Source Map 正常，但分包（LogicLib.js）的不正常？

A: 这是 LayaAir IDE 预览服务器的已知限制。分包是在运行时动态加载的，浏览器可能没有正确识别动态加载的 Source Map。

**解决方案**:
- 使用 `npm run dev` 启动独立的开发服务器
- 或者在发布到 `release/web/` 后使用本地 HTTP 服务器测试

### Q: 如何验证 Source Map 是否加载？

A: 打开开发者工具 → Sources 标签 → 查看左侧文件树：
- ✅ 如果看到 `LogicMain.ts` 等原始文件：Source Map 生效
- ❌ 如果只看到 `LogicLib.js`：Source Map 未加载

---

**最后更新**: 2025-12-11
**LayaAir 版本**: 3.3-beta4
