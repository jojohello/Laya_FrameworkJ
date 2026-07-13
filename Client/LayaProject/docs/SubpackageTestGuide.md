# 分包打包测试指南

## 🎯 测试目标

验证 LayaAir 3.3 是否成功将项目打包成：
- **主包（Main Package）**: 包含 Start 模块
- **Logic 分包（Subpackage）**: 包含 Logic 模块

---

## 📋 测试步骤

### Step 1: 在 LayaAir IDE 中发布项目

1. **打开 LayaAir IDE**
   - 打开你的项目：`LayaProject`

2. **选择发布平台**
   - 点击顶部菜单：`发布` → `Web 平台`
   - 或者：`Ctrl + F7`（Windows）/ `Cmd + F7`（Mac）

3. **等待构建完成**
   - 观察控制台输出
   - 看到 "发布成功" 提示

4. **记录发布时间**
   - 确保后续检查的文件是最新的

---

### Step 2: 检查生成的目录结构

#### 预期的目录结构（Web 平台）

```
bin/
├── index.html                    # 入口 HTML
├── js/
│   ├── bundle.js                 # 主包代码（Start 模块）
│   ├── bundle.js.map             # Source Map
│   └── [可能有其他文件]
└── resources/                    # 资源目录
    ├── startupUI/                # 主包资源（登录界面）
    │   └── login/
    │       └── loginView.ls
    └── logic/                    # Logic 分包资源 ← 关键！
        └── [Logic 模块的资源]
```

#### 如果使用了 ScriptBundle（代码分包）

```
bin/
├── js/
│   ├── bundle.js                 # 主包代码
│   └── bundles/                  # 代码分包目录
│       └── logic.js              # Logic 分包代码 ← 关键！
```

---

### Step 3: 使用命令行检查文件

#### Windows 用户

```powershell
# 1. 进入 bin 目录
cd e:\Laya_FrameworkJ_laya3\Client\LayaProject\bin

# 2. 检查 resources 目录结构
tree resources /F

# 3. 检查是否存在 logic 分包资源
dir resources\logic /s

# 4. 检查 js 目录（代码分包）
dir js /s

# 5. 查看主包大小
powershell -Command "Get-ChildItem -Recurse | Measure-Object -Property Length -Sum"
```

#### Mac/Linux 用户

```bash
# 1. 进入 bin 目录
cd /path/to/LayaProject/bin

# 2. 检查目录结构
tree resources

# 3. 检查是否存在 logic 分包资源
ls -la resources/logic

# 4. 检查 js 目录（代码分包）
ls -la js/bundles

# 5. 查看主包大小
du -sh .
du -sh resources/logic  # 分包大小
```

---

### Step 4: 在浏览器中验证分包加载

#### 1. 启动本地服务器

**方式 A：使用 LayaAir IDE 的运行功能**
- 点击 IDE 顶部的 `运行` 按钮
- 或按 `F5`

**方式 B：使用 Node.js 启动服务器**

```bash
# 进入 bin 目录
cd e:\Laya_FrameworkJ_laya3\Client\LayaProject\bin

# 使用 http-server（需要先安装：npm install -g http-server）
http-server -p 8080

# 或使用 Python
python -m http.server 8080
```

#### 2. 打开浏览器开发者工具

- 打开浏览器：`http://localhost:8080`
- 按 `F12` 打开开发者工具
- 切换到 `Network`（网络）标签
- 勾选 `Preserve log`（保留日志）

#### 3. 观察资源加载

**主包加载（游戏启动时）**

在 Network 标签中，你应该看到：

```
✅ bundle.js          (主包代码)
✅ startupUI/login/loginView.ls  (登录界面)
❌ logic/...          (Logic 分包资源不应该加载)
```

**分包加载（登录成功后）**

登录成功后，你应该看到新的请求：

```
✅ logic/...          (Logic 分包资源开始加载)
✅ bundles/logic.js   (如果使用了 ScriptBundle)
```

#### 4. 观察控制台日志

打开 `Console`（控制台）标签，你应该看到：

```
[StartMain] ========== 主包启动 ==========
[StartMain] ✅ 主包启动完成，等待用户登录
[LoginView] 登录成功，准备触发 Logic 分包加载
[StartMain] ========== 登录成功，开始加载 Logic 分包 ==========
[StartMain] 显示 Loading 界面
[StartMain] 开始加载 Logic 分包...
[StartMain] Logic 分包加载进度: 10.0%
[StartMain] Logic 分包加载进度: 50.0%
[StartMain] Logic 分包加载进度: 100.0%
[StartMain] ✅ Logic 分包加载完成
[StartMain] ✅✅✅ 分包加载完成，成功进入游戏！
```

---

### Step 5: 验证 Laya.loader.loadPackage API

在浏览器控制台中手动测试分包加载 API：

```javascript
// 1. 检查 Laya.loader.loadPackage 是否存在
console.log(typeof Laya.loader.loadPackage);  // 应该输出 "function"

// 2. 手动触发分包加载（测试）
Laya.loader.loadPackage("logic", (progress) => {
    console.log("测试加载进度:", progress);
}).then(() => {
    console.log("✅ 测试加载成功");
}).catch((error) => {
    console.error("❌ 测试加载失败:", error);
});
```

---

### Step 6: 检查微信小游戏分包配置（如果发布微信）

#### 1. 发布到微信小游戏

在 LayaAir IDE 中：
- 点击 `发布` → `微信小游戏`
- 等待构建完成

#### 2. 检查 game.json 文件

查看 `bin/game.json`，应该包含分包配置：

```json
{
  "deviceOrientation": "portrait",
  "subpackages": [
    {
      "name": "logic",
      "root": "logic/"
    }
  ]
}
```

#### 3. 在微信开发者工具中验证

1. 打开微信开发者工具
2. 导入项目（选择 `bin` 目录）
3. 点击 `详情` 标签
4. 查看 `本地代码` 部分：

```
主包: 2.1 MB  ✅
logic 分包: 8.5 MB  ✅
总计: 10.6 MB  ✅
```

5. 在 `调试器` → `Network` 中观察资源加载

---

## ✅ 成功的标志

### 文件层面

- ✅ `bin/resources/logic/` 目录存在
- ✅ `bin/js/bundles/logic.js` 文件存在（如果使用 ScriptBundle）
- ✅ `bin/game.json` 包含 `subpackages` 配置（微信小游戏）

### 运行时层面

- ✅ 游戏启动时**不加载** logic 分包资源
- ✅ 登录成功后**才加载** logic 分包资源
- ✅ 控制台显示分包加载进度日志
- ✅ LoadingView 界面显示进度条

### 性能层面

- ✅ 首屏加载时间缩短（主包更小）
- ✅ Network 标签显示资源分批加载

---

## ❌ 常见问题排查

### 问题 1: bin/resources/logic 目录不存在

**原因**：
- 资源没有放在 `assets/logic/` 目录
- 分包配置错误

**解决方案**：
1. 确认 `assets/logic/` 目录存在且有资源
2. 检查 `BuildSettings.json` 的 `subpackages` 配置
3. 重新发布项目

---

### 问题 2: 运行时所有资源都立即加载

**原因**：
- LayaAir 没有正确识别分包配置
- 分包资源路径错误

**解决方案**：
1. 检查 `BuildSettings.json` 的 `enableSubpackages: true`
2. 确认分包 `name` 和 `root` 配置正确
3. 清理缓存后重新构建：
   ```bash
   # 删除 bin 目录
   rm -rf bin

   # 重新发布
   ```

---

### 问题 3: Laya.loader.loadPackage 报错

**错误示例**：
```
TypeError: Laya.loader.loadPackage is not a function
```

**原因**：
- LayaAir 版本过低，不支持分包 API
- 或者分包功能未启用

**解决方案**：
1. 确认 LayaAir 版本 ≥ 3.0
2. 升级到 LayaAir 3.3-beta4
3. 检查 `BuildSettings.json` 的 `enableSubpackages: true`

---

### 问题 4: 微信开发者工具不显示分包

**原因**：
- `game.json` 未正确生成
- 微信开发者工具缓存问题

**解决方案**：
1. 手动检查 `bin/game.json` 是否包含 `subpackages`
2. 在微信开发者工具中：
   - 点击 `清缓存` → `清除所有缓存`
   - 重新编译

---

## 🔍 高级测试：分析包体大小

### 使用 source-map-explorer（可选）

```bash
# 1. 安装工具
npm install -g source-map-explorer

# 2. 分析主包代码
source-map-explorer bin/js/bundle.js

# 3. 分析分包代码（如果有）
source-map-explorer bin/js/bundles/logic.js
```

这会生成一个可视化图表，显示代码体积分布。

---

## 📊 测试检查清单

打印此清单，逐项验证：

- [ ] 项目发布成功，无错误
- [ ] `bin/resources/logic/` 目录存在
- [ ] 游戏启动时不加载 logic 分包资源（Network 标签确认）
- [ ] 登录成功后触发分包加载（控制台日志确认）
- [ ] LoadingView 界面显示并更新进度
- [ ] 分包加载完成后进入游戏
- [ ] 控制台无错误日志
- [ ] 主包大小 < 4M（微信小游戏要求）
- [ ] `game.json` 包含分包配置（微信平台）
- [ ] 微信开发者工具显示分包信息（微信平台）

---

## 📚 参考资料

- [LayaAir 3.3 发布设置文档](https://layaair.com/3.x/doc/released/generalSetting/readme.html)
- [微信小游戏分包文档](https://developers.weixin.qq.com/minigame/dev/guide/base-ability/subPackage/useSubPackage.html)
- [SubpackageGuide.md](./SubpackageGuide.md) - 分包实施指南

---

**最后更新**: 2025-12-11
**测试建议**: 同时在 Web 和微信小游戏平台进行测试
