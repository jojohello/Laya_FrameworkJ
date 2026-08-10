# Start 启动层

`start` 是客户端首包，负责在 Logic 分包加载前完成引擎初始化、登录、网络连接、加载界面和平台 SDK 接入。

## 入口与模块

- `StartMain.ts`：首包流程入口，登录成功后加载并初始化 `LogicMain`。
- `MyGameConfig.ts`：人工维护的环境、平台、登录 API、远程资源地址和开发 Gateway 兜底配置；启动时向 Logic 发布只读快照。
- `loading/`：`LoadingMgr` 和加载界面。
- `login/`：`LoginMgr`、登录协议和登录界面逻辑。
- `network/`：`NetworkManager`、Socket、心跳、重连和消息分发。
- `sdk/`：`SDKMgr` 与平台策略实现。
- `sound/`：`MusicMgr` 与音频播放封装；背景音乐/特效音效、独立音量/静音、本地持久化与后台/前台生命周期。
- `screen/ScreenAdapter.ts`：统一屏幕能力入口；读取平台/CSS 安全区与微信胶囊矩形，换算为 Laya Stage 坐标，并通过 `SafeAreaLayout` 更新页面的普通 `safeAreaRoot` GBox。
- `utils/`：首包层级等局部工具。

Start 创建的跨分包服务通过 `window` 暴露，由 Logic 的 `App` 统一取得。不要让 Logic 直接静态导入这里的实现类。

页面不直接消费安全区坐标。Start 的场景入口和 Logic 的 `UIManager` 调用 `ScreenAdapter.bind(scene)` 挂载通用 `SafeAreaLayout`；组件只更新名为 `safeAreaRoot` 的普通 GBox，具体内容继续使用编辑器 Relation。只有胶囊避让节点的纵轴由组件额外处理。`layout` 快照保留给诊断与非 UI 基础设施，包含来源和 `exact/estimated/none` 置信度；业务页面不得自行判断设备型号、重复调用平台 API或写安全区坐标。

当前启动、登录、Loading、主界面、背包、战斗 HUD、胜负结算和通用弹窗均已接入该适配结构。微信小游戏发布包已在微信开发者工具的多种设备分辨率下完成界面位置验收；新增或调整自适应页面时仍需运行 `tools/ui/validate-safe-area-relations.ps1`，并重新检查顶部安全区、底部导航、系统胶囊和点击热区。

`LoadingMgr.show(options)` 是全项目唯一的 Loading 显示入口。LoadingMgr 只负责界面显示、逐帧刷新、最短显示时间和关闭动画；调用模块通过 `onProcess()` 返回当前文字与 `0..1` 进度，通过 `isEnd()` 定义本次工作何时完成。`show()` 返回的 Promise 在界面完全关闭后完成。同一时刻只允许一个 Loading 会话，调用模块必须在自己的串行边界内使用。

## 启动顺序

1. 初始化引擎、显示层和事件分发器。
2. 初始化网络上下文、协议和登录管理器。
3. 打开登录场景，注册远程 `music` 包的 URL 映射后播放登录 BGM；微信端把 Laya 解析后的带版本哈希远程 URL 直接交给 `InnerAudioContext`，不预下载完整 MP3。
4. 登录成功后显示 Loading，先加载微信本地 `logic` 代码分包；IDE 预览直接加载项目资源包，发布产物按 `MyGameConfig.resourcePackageBaseUrl` 加载远程资源包；随后初始化 LogicMain。
5. 初始化 `LogicMain`，完成核心连接流程后进入主场景。

## 环境与远程资源

`MyGameConfig.environment` 是环境选择的唯一入口，资源包地址由 `MyGameConfig.resourcePackageBaseUrl` 统一决定：

| 运行方式 | 环境配置 | 资源包注册方式 |
| --- | --- | --- |
| LayaAir IDE 预览 | 通常为 `Local` | `LayaEnv.isPreview` 为真，调用 `loadPackage(name)`，直接使用项目内资源 |
| 微信开发者工具真实微信登录联调 | `Test`（当前选中） | 发布产物中调用 `loadPackage(name, "http://127.0.0.1:8080/")`；远程包目录需由本机 HTTP 服务托管，并通过 `wx.login` 登录本机 Login Server |
| 正式远端环境 | `Production` | 发布产物中调用 `loadPackage(name, resourceBaseUrl)`；登录与资源地址强制使用 HTTPS |

当前 `Test` 配置只用于同机微信开发者工具验收真实微信自动登录。微信开发者工具与 HTTP 服务在同一台电脑时可使用 `127.0.0.1`；真机联调必须改用电脑局域网 IP，并保证手机可访问。正式环境不得配置 Gateway 兜底地址，Gateway 连接地址以登录响应为准。

远程 `music`/`sound` 与其他动态目录一样，必须同时出现在 `BuildSettings.alwaysIncluded`、远程 `subpackages` 和 `MyGameConfig.remoteResourcePackages`。`alwaysIncluded` 只防止导出裁剪，不会把远程包复制进微信首包。登录阶段只提前注册 `music/fileconfig.json`；微信端 `MusicMgr` 使用 `Laya.URL.formatURL`/`postFormatURL` 取得包含远程基址和版本哈希的最终 URL，直接交给 `wx.createInnerAudioContext()` 流式缓冲。其他平台保持 `SoundManager.useAudioMusic=true` 并使用 Laya 长音频通道。

登录入口先按运行平台分流：非微信小游戏平台始终显示账号输入；微信小游戏在 `MyGameConfig.forceAccountLogin=false` 时隐藏输入并自动执行 `wx.login`，界面显示登录状态与进度条；Local/Test 联调可把该开关设为 `true`，改用账号输入，但 Login Server 当前进程还必须显式设置 `WECHAT_DEVELOPER_CODE_ENABLED=true`。Production 禁止强制账号登录。昵称头像授权是可选资料能力；未授权、拒绝或资料 API 失败时仍只凭 code 登录。Login Server 通过 `code2Session` 验证身份，AppID/AppSecret 只从服务端进程环境变量取得。

运行时场景路径相对 `assets/` 根。修改启动流程后必须验证登录场景关闭、Loading 生命周期、Logic 重复初始化和失败恢复。
