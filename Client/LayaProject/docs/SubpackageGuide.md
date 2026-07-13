# 分包加载实施指南

## 📌 分包方案概述

本项目采用 **Start（主包） + Logic（分包）** 的分包架构，以优化游戏启动速度，满足微信小游戏包体限制。

---

## 🎯 分包架构

### 包体划分

```
主包（Start Package）≤ 4M
├── src/core/          # 核心基础设施（IManager, ManagerHub, Protocol）
├── src/start/         # 启动模块（登录、SDK、网络）
├── assets/startupUI/  # 登录界面资源
└── bundle.js          # 主包代码（编译后）

Logic 分包（Subpackage）≤ 16M
├── src/logic/         # 游戏逻辑模块
├── assets/logic/      # 游戏主界面UI资源
└── bundles/logic.js   # Logic 代码（编译后，如果使用 ScriptBundle）
```

### 加载时间线

```
[时间轴]
0s ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━>

├─ 0s: 下载主包（Start Package）
│
├─ 2s: 主包下载完成 ✅
│      ↓
│      游戏立即启动 🎮
│      显示登录界面
│      用户输入账号
│
├─ 10s: 用户登录成功
│       ↓
│       调用 StartMain.onLoginSuccess()
│       ↓
│       显示 LoadingView 界面
│       ↓
│       调用 Laya.loader.loadPackage("logic")
│       ↓
│       开始下载 Logic 分包（后台加载）
│
├─ 20s: Logic 分包下载完成 ✅
│       ↓
│       自动执行 logic.js 代码（如果使用 ScriptBundle）
│       ↓
│       初始化 LogicMain
│       ↓
│       连接 Gateway WebSocket
│       ↓
│       登录 Game Server
│       ↓
│       进入游戏主界面
│       ↓
│       关闭 LoadingView
│
├─ 22s: 🎉 成功进入游戏！
```

---

## 📋 实施步骤

### Step 1: 配置分包（BuildSettings.json）

文件路径：`settings/BuildSettings.json`

```json
{
  "name": "JFramework",
  "enableSubpackages": true,
  "subpackages": [
    {
      "name": "logic",
      "root": "logic/"
    }
  ],
  "alwaysIncluded": [
    "ttf",
    "bigImg",
    "startupUI"  // 主包必须包含启动UI
  ]
}
```

**说明**：
- `enableSubpackages: true`：启用分包功能
- `subpackages`：定义分包列表
  - `name: "logic"`：分包名称
  - `root: "logic/"`：分包资源根目录（对应 `assets/logic/`）
- `alwaysIncluded`：主包必须包含的资源目录

---

### Step 2: 创建 Loading 界面

文件路径：`src/start/loading/LoadingView.ts`

**核心功能**：
- ✅ 显示加载进度条（0-100%）
- ✅ 显示加载提示文本（轮播）
- ✅ 加载动画（旋转圆圈）
- ✅ 错误提示

**关键方法**：
```typescript
export class LoadingView extends Laya.Scene {
    // 更新进度（0-1）
    public updateProgress(progress: number): void;

    // 加载完成，关闭界面
    public onLoadComplete(): void;

    // 显示错误
    public showError(errorMessage: string): void;
}
```

---

### Step 3: 实现分包加载逻辑（StartMain.ts）

文件路径：`src/start/StartMain.ts`

**主要流程**：

```typescript
export class StartMain {
    /**
     * 登录成功后调用 - 加载 Logic 分包
     */
    async onLoginSuccess(): Promise<void> {
        // 1. 显示 Loading 界面
        await this.showLoadingView();

        // 2. 加载 Logic 分包（资源 + 代码）
        await this.loadLogicSubpackage();

        // 3. 初始化 LogicMain
        await this.initLogicMain();

        // 4. 启动游戏核心流程（连接 Gateway → 登录）
        await this.startGameCoreFlow();

        // 5. 进入游戏主界面
        await this.enterGame();

        // 6. 关闭 Loading 界面
        this.hideLoadingView();
    }

    /**
     * 加载 Logic 分包
     */
    private async loadLogicSubpackage(): Promise<void> {
        return new Promise((resolve, reject) => {
            // 进度回调
            const onProgress = (progress: any) => {
                let progressValue = 0;

                if (typeof progress === 'number') {
                    progressValue = progress;
                } else if (progress?.loaded && progress?.total) {
                    progressValue = progress.loaded / progress.total;
                }

                // 更新 Loading 界面
                this._loadingView?.updateProgress(progressValue);
            };

            // 调用 LayaAir 分包加载 API
            Laya.loader.loadPackage("logic", onProgress)
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * 初始化 LogicMain（动态导入）
     */
    private async initLogicMain(): Promise<void> {
        // 动态导入 LogicMain
        const { LogicMain } = await import("../logic/LogicMain");

        // 创建实例并初始化
        this._logicMain = new LogicMain();
        this._logicMain.init();

        // 挂载到 window
        (Laya.Browser.window as any).logicMain = this._logicMain;
    }
}
```

---

### Step 4: 修改登录流程（LoginView.ts）

文件路径：`src/start/login/LoginView.ts`

**登录成功处理**：

```typescript
private async onLoginSuccess(loginResult: any): Promise<void> {
    // 1. 存储连接信息到 NetworkContext
    this.saveNetworkInfo(loginResult);

    // 2. 显示成功提示
    this.showTip("登录成功，正在加载游戏资源...");

    // 3. 触发 StartMain 的分包加载流程
    const startMain = (Laya.Browser.window as any).startMain;
    if (!startMain) {
        throw new Error("StartMain 未初始化");
    }

    // 延迟一帧，确保界面更新后再开始加载
    Laya.timer.frameOnce(1, this, async () => {
        try {
            // 调用 StartMain 的登录成功回调（加载分包）
            await startMain.onLoginSuccess();
        } catch (error: any) {
            console.error("[LoginView] 分包加载失败:", error);
            this.showTip("加载游戏资源失败，请重试");
        }
    });
}
```

---

### Step 5: 挂载 StartMain 到 window（StartUpView.ts）

文件路径：`src/start/StartUpView.ts`

```typescript
public async onOpened(): Promise<void> {
    // 创建 StartMain 实例
    const startMain = new StartMain();

    // 挂载到 window（供 LoginView 调用）
    (Laya.Browser.window as any).startMain = startMain;

    // 启动主包流程
    await startMain.start();
}
```

---

### Step 6: 修改 tsconfig.json（支持动态导入）

文件路径：`tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "esnext",      // ← 改为 esnext，支持动态 import
    "target": "es2020",       // ← 升级 target
    "strict": true,
    "strictNullChecks": false,
    "noEmitHelpers": true,
    "sourceMap": false,
    "experimentalDecorators": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true
  }
}
```

---

## 🚀 使用说明

### 开发环境测试

1. **在 LayaAir IDE 中发布项目**
   - 打开项目
   - 点击"发布" → "Web 平台"
   - 等待构建完成

2. **检查生成的文件结构**

```
bin/
├── index.html
├── js/
│   ├── bundle.js         # 主包代码（Start）
│   └── bundles/
│       └── logic.js      # Logic 分包代码（如果使用 ScriptBundle）
└── resources/
    ├── startupUI/        # 主包资源
    └── logic/            # Logic 分包资源
```

3. **本地测试**

```bash
# 启动本地服务器
npm run dev

# 或者使用 LayaAir IDE 的"运行"按钮
```

4. **观察控制台日志**

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
[StartMain] 开始初始化 LogicMain...
[StartMain] ✅ LogicMain 初始化完成
[StartMain] 启动游戏核心流程...
[LogicMain] 开始核心流程...
[LogicMain] ✅✅✅ 核心流程完成！
[StartMain] ✅✅✅ 分包加载完成，成功进入游戏！
```

---

### 微信小游戏发布

1. **配置 game.json**

LayaAir IDE 会自动生成 `game.json`，包含分包配置：

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

2. **检查包体大小**

```bash
# 检查主包大小（必须 ≤ 4M）
du -sh bin/

# 检查分包大小（建议 ≤ 10M）
du -sh bin/logic/
```

3. **上传到微信小游戏**

- 打开微信开发者工具
- 导入项目
- 点击"上传"
- 微信会自动识别分包配置

---

## ⚠️ 注意事项

### 1. 分包资源路径

**错误示例**：
```typescript
// ❌ 错误：主包代码直接引用分包资源
await Laya.Scene.open("logic/ui/MainView.ls");  // 主包中会报错
```

**正确示例**：
```typescript
// ✅ 正确：在分包加载完成后才能访问分包资源
await this.loadLogicSubpackage();  // 先加载分包
await Laya.Scene.open("logic/ui/MainView.ls");  // 然后才能访问
```

### 2. 代码分包（ScriptBundle）

如果需要代码分包（将 Logic 代码打包成独立的 `logic.js`）：

1. 在 LayaAir IDE 中创建 ScriptBundle
   - 右键 → 新建 → ScriptBundle
   - 命名为 `LogicBundle.scriptbundle`
   - 配置包含 `src/logic/` 目录

2. 修改 `BuildSettings.json`：
```json
{
  "subpackages": [
    {
      "name": "logic",
      "root": "logic/",
      "mainScript": {
        "path": "assets/script-bundles/LogicBundle.scriptbundle"
      }
    }
  ]
}
```

### 3. 动态导入的限制

- ✅ **支持**：`await import("../logic/LogicMain")`
- ❌ **不支持**：动态路径 `await import(variablePath)`

### 4. 包体限制（微信小游戏 2025 标准）

- 主包：≤ 4M
- 整个小游戏（主包 + 所有分包）：≤ 20M（开通虚拟支付后 ≤ 30M）
- 单个分包：无限制

---

## 🐛 常见问题

### Q1: 分包加载失败，提示 404

**原因**：
- 分包名称配置错误
- 资源未正确放置在 `assets/logic/` 目录

**解决**：
1. 检查 `BuildSettings.json` 中的 `subpackages.name`
2. 确认资源在 `assets/logic/` 目录下
3. 重新发布项目

---

### Q2: 动态导入报错："Dynamic imports are only supported when..."

**原因**：
`tsconfig.json` 的 `module` 配置不支持动态导入

**解决**：
修改 `tsconfig.json`：
```json
{
  "compilerOptions": {
    "module": "esnext",
    "target": "es2020"
  }
}
```

---

### Q3: Loading 界面一直显示 0%

**原因**：
- 分包加载 API 调用失败
- 进度回调未正确处理

**解决**：
1. 检查控制台错误日志
2. 确认 `Laya.loader.loadPackage("logic", onProgress)` 返回 Promise
3. 检查 `onProgress` 回调是否正确解析 progress 参数

---

### Q4: 主包超过 4M

**解决方案**：

1. **压缩资源**：
   - 图片使用 WebP 格式
   - 使用图集（Atlas）减少文件数量
   - 音频使用 MP3 或 AAC 格式

2. **移动资源到分包**：
   - 将非必要资源从 `assets/startupUI/` 移动到 `assets/logic/`

3. **代码优化**：
   - 使用 ScriptBundle 将 Logic 代码分离
   - 移除未使用的依赖

---

## 📚 参考资料

- [LayaAir 3.3 官方文档 - 分包加载](https://layaair.com/3.x/doc/released/generalSetting/readme.html)
- [微信小游戏分包加载文档](https://developers.weixin.qq.com/minigame/dev/guide/base-ability/subPackage/useSubPackage.html)
- [项目主 README.md](../README.md)
- [Network 模块设计文档](../src/start/network/Design.md)

---

**最后更新**: 2025-12-11
**状态**: ✅ 实施完成
