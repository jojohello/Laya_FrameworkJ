# 登录模块

登录模块在 Start 首包内完成平台认证、登录响应校验和进入 Logic 前的网络信息保存。跨端字段与安全语义以 `Protocol/contracts/login/` 为唯一来源；客户端消费 IDE 已导入的 `LoginPayloads.generated.ts`，不得另写 wire DTO。

## 入口与职责

- `LoginMgr`：串行化平台登录，同一时刻只允许一个请求；保存当前会话结果与上次开发账号。
- `LoginView`：根据平台与强制账号开关显示账号输入或微信自动登录状态；自动登录使用底部进度条，账号提交期间使用 `loginProgressMask` 阻断输入和重复点击。
- `SDKMgr`：按运行平台选择 `WebSDK` 或 `WechatMiniGameSDK`。
- `WechatMiniGameSDK`：调用微信客户端 API，只提交一次性 code 与 `encryptedData/iv`；不提交客户端声明的 `openid`、`unionid` 或 `userId`。
- `LoginPayloads.generated.ts`：由登录 Schema 生成的请求、响应类型与结构守卫。

## 配置

平台与 `MyGameConfig.forceAccountLogin` 共同决定登录入口：

| 运行条件 | 登录页行为 |
| --- | --- |
| 非微信小游戏平台 | 显示账号输入并走对应平台的账号登录 |
| 微信小游戏，`forceAccountLogin=false` | 隐藏账号输入，显示底部“正在登录”进度并自动使用真实微信身份 |
| 微信小游戏，`forceAccountLogin=true` | 显示账号输入，使用开发 code；仅限 Local/Test 联调 |

Production 必须保持 `forceAccountLogin=false`。真实微信模式没有手动触发开关，进入登录页后始终自动提交；失败时显示重试入口。

Local/Test 微信开发账号要求 Login Server 当前进程显式设置：

```powershell
$env:WECHAT_DEVELOPER_CODE_ENABLED="true"
```

Production 禁止开启该变量。

## 真实微信流程

1. 微信小游戏且未强制账号登录时，登录页直接调用 `wx.login`，不检查昵称头像权限。
2. 客户端仅在已有 `scope.userInfo` 权限且资料 API 成功时附带 `encryptedData/iv`；否则只提交 code。
3. 客户端向 `POST /api/login` 提交生成契约定义的微信请求。
4. Login Server 调用 `code2Session`，以服务端获得的 `openid` 查找或创建内部 `userId`。
5. 没有可验证资料时服务端生成默认昵称和头像；历史账号资料为空时登录边界自动补齐；有资料时验证后更新，三者都返回符合生成契约的登录成功响应。
6. 客户端先用 `isLoginResponse` 校验完整响应，再保存 `userId + token + loginTimestamp + gatewayWsUrl`，加载 Logic 分包。

昵称头像授权是独立的资料完善能力，拒绝或失败不得影响账号登录。登录失败会撤销阻断遮罩并允许重试。原始 code、`session_key`、AppSecret、Token 和未解析的响应体不得写入日志。

当前本机已在 LayaAir IDE 完成账号登录，并在微信开发者工具完成真实微信自动登录、进度与失败恢复界面验收；两条路径均可完成 Gateway 认证并进入游戏。多次微信登录返回同一 `userId`，重新进入后玩家名称和背包数据一致，账号身份映射与服务器权威数据恢复已经通过实际链路验证。真实昵称头像授权/拒绝和 Test HTTPS 部署仍按当前 Plan 验收。

## 本地状态

客户端只在 `lastLoginAccount` 中记录上次开发账号或服务端返回的 `userId`，不持久化 Token。每次启动重新完成平台认证。

## 使用

通常由 `LoginView` 驱动：

```typescript
const result = await LoginMgr.instance.login(accountName);
```

真实微信自动登录使用：

```typescript
const result = await LoginMgr.instance.autoLogin();
```

UI 不得构造登录请求或把本地账号值作为正式身份；平台请求由 SDK 适配器构造，账号归属由 Login Server 决定。
