# Start 启动层

`start` 是客户端首包，负责在 Logic 分包加载前完成引擎初始化、登录、网络连接、加载界面和平台 SDK 接入。

## 入口与模块

- `StartMain.ts`：首包流程入口，登录成功后加载并初始化 `LogicMain`。
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
4. 登录成功后显示 Loading 并加载 Logic 分包。
5. 初始化 `LogicMain`，完成核心连接流程后进入主场景。

运行时场景路径相对 `assets/` 根。修改启动流程后必须验证登录场景关闭、Loading 生命周期、Logic 重复初始化和失败恢复。
