# Start 启动层

`start` 是客户端首包，负责在 Logic 分包加载前完成引擎初始化、登录、网络连接、加载界面和平台 SDK 接入。

## 入口与模块

- `StartMain.ts`：首包流程入口，登录成功后加载并初始化 `LogicMain`。
- `MyGameConfig.ts`：人工维护的环境、平台、登录 API、远程资源地址和开发 Gateway 兜底配置；启动时向 Logic 发布只读快照。
- `loading/`：`LoadingMgr` 和加载界面。
- `login/`：`LoginMgr`、登录协议和登录界面逻辑。
- `network/`：`NetworkManager`、Socket、心跳、重连和消息分发。
- `sdk/`：`SDKMgr` 与平台策略实现。
- `utils/`：首包层级等局部工具。

Start 创建的跨分包服务通过 `window` 暴露，由 Logic 的 `App` 统一取得。不要让 Logic 直接静态导入这里的实现类。

`LoadingMgr.show(options)` 是全项目唯一的 Loading 显示入口。LoadingMgr 只负责界面显示、逐帧刷新、最短显示时间和关闭动画；调用模块通过 `onProcess()` 返回当前文字与 `0..1` 进度，通过 `isEnd()` 定义本次工作何时完成。`show()` 返回的 Promise 在界面完全关闭后完成。同一时刻只允许一个 Loading 会话，调用模块必须在自己的串行边界内使用。

## 启动顺序

1. 初始化引擎、显示层和事件分发器。
2. 初始化网络上下文、协议和登录管理器。
3. 打开登录场景。
4. 登录成功后显示 Loading，先加载微信本地 `logic` 代码分包；IDE 预览直接加载项目资源包，发布产物按 `MyGameConfig.resourcePackageBaseUrl` 加载远程资源包；随后初始化 LogicMain。
5. 初始化 `LogicMain`，完成核心连接流程后进入主场景。

## 环境与远程资源

`MyGameConfig.environment` 是环境选择的唯一入口，资源包地址由 `MyGameConfig.resourcePackageBaseUrl` 统一决定：

| 运行方式 | 环境配置 | 资源包注册方式 |
| --- | --- | --- |
| LayaAir IDE 预览 | 通常为 `Local` | `LayaEnv.isPreview` 为真，调用 `loadPackage(name)`，直接使用项目内资源 |
| 微信开发者工具本地联调 | `Local` | 发布产物中调用 `loadPackage(name, "http://127.0.0.1:8080/")`；远程包目录需由本机 HTTP 服务托管 |
| 正式远端环境 | `Production` | 发布产物中调用 `loadPackage(name, resourceBaseUrl)`；登录与资源地址强制使用 HTTPS |

微信开发者工具与 HTTP 服务在同一台电脑时可使用 `127.0.0.1`；真机联调必须改用电脑局域网 IP，并保证手机可访问。正式环境不得配置 Gateway 兜底地址，Gateway 连接地址以登录响应为准。

平台 SDK 与登录环境是两个独立维度：微信小游戏始终使用 `WechatMiniGameSDK` 访问微信能力；`Local` 的 `loginMode` 使用 Login Server 现有的开发微信凭据，`Test`/`Production` 必须使用 `wx.login` 返回的真实临时代码。开发凭据不得用于非 Local 环境；正式微信认证仍要求 Login Server 接入微信 `code2Session` 并从服务端环境变量取得 AppID/AppSecret。

运行时场景路径相对 `assets/` 根。修改启动流程后必须验证登录场景关闭、Loading 生命周期、Logic 重复初始化和失败恢复。
