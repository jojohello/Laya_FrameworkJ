# 登录跨端契约

## 作用域和结果

本契约定义客户端 Start 包通过 `POST /api/login` 登录 Login Server 的稳定 HTTP 负载，以及微信小游戏账号绑定和头像昵称资料的安全边界。

目标是让微信小游戏使用 `wx.login` 的一次性 code 独立完成账号认证；昵称和头像仅在用户另行授权后作为可选展示资料提交。游客登录、Gateway 三因子认证、角色选择和游戏数据同步不在本契约内。

## 权威和身份

| 状态或决策 | 权威 | 客户端职责 | 身份键 |
| --- | --- | --- | --- |
| 游戏账号 | Login/Central Server | 保存并展示返回的 `userId` | 服务端生成的 `userId` |
| 微信身份绑定 | Login Server + 微信 `code2Session` | 只提交 `wx.login` code | 当前微信应用下的 `openid` |
| 跨微信应用关联 | 微信开放平台 | 不作为登录前提 | 可选 `unionid` |
| 昵称和头像 | 微信加密用户资料，经 Login Server 校验后保存 | 触发原生授权并提交 `encryptedData`/`iv` | 已认证 `userId` |
| `session_key` | Login Server | 不可读取、缓存或上传 | 与本次 code 对应的服务端临时密钥 |

客户端提供的 `openid`、`unionid`、明文昵称、明文头像、`userId` 都不是可信认证输入。`openid` 由服务端调用微信接口取得；项目自己的 `userId` 才是后续会话和路由使用的账号身份。

`unionid` 只有小游戏绑定微信开放平台账号且微信实际返回时才存在，因此不能作为必填登录主键。若未来需要跨多个微信应用合并账号，必须另行设计经过验证的绑定流程，不能在本登录请求中静默替换现有账号。

## 不变量和状态机

- 微信真实模式必须由 Login Server 使用服务端环境中的 AppID/AppSecret 调用 `code2Session`；客户端和仓库都不得持有 AppSecret。
- 真实微信请求只要求 `wx.login` code。`profileEncryptedData` 和 `profileIv` 均为可选，但只允许成对提供；提供时 Login Server 使用本次 `code2Session` 返回的 `session_key` 解密资料，并校验资料中的 `watermark.appid` 与当前服务端 AppID 一致。
- 解密资料若包含 `openId`，它必须与 `code2Session` 返回的 `openid` 一致；不一致时整个登录失败，不创建或更新账号。
- 微信 `code` 是一次性凭据。客户端同一时刻只允许一个登录请求；失败后重新调用 `wx.login`，不得重放旧 code。
- 非微信小游戏平台使用账号输入；微信小游戏仅在 `forceAccountLogin=true` 时使用开发账号，否则进入登录页后自动提交新鲜 code。该开关不改变真实微信身份解析和资料授权边界。
- 已有 `scope.userInfo` 授权时，客户端可以在登录请求中附带 `wx.getUserInfo` 的加密资料；权限不存在、已失效或资料 API 失败时省略资料并继续登录。
- 昵称头像授权属于登录后的资料完善能力。授权入口、拒绝和重试不得改变登录状态，也不得把昵称头像升级为认证或授权依据。
- 开发凭据只允许 Local/Test 联调显式开启服务端 `WECHAT_DEVELOPER_CODE_ENABLED` 时使用；Production 部署必须关闭该变量，客户端 Production 配置也必须拒绝 `forceAccountLogin=true`。
- 微信适配器缺少 AppID/AppSecret 时只拒绝真实微信请求并返回 `WECHAT_CONFIG_MISSING`，不得阻止 Login Server 启动或影响其他登录类型；Test/Production 部署验收仍必须在对外开放前确认真实微信配置完整。
- `(thirdPartyType, openid)` 必须唯一；并发创建同一微信身份最终只能得到同一个 `userId`。
- 并发插入命中第三方身份唯一约束时，创建事务先回滚，再在新事务读取胜出账号；不得把唯一冲突直接作为登录失败返回。
- `session_key`、AppSecret、原始 code、JWT 和完整加密资料不得写入日志或登录记录。

## HTTP 消息

`schema.json` 是 `LoginRequest`、`LoginResponse` 的字段、长度、条件规则和 `POST /api/login` 绑定唯一来源。

成功响应必须包含账号、登录时间、昵称、头像和 Gateway 地址。失败响应只包含稳定错误码和用户可展示信息；失败不表示账号状态已经改变。客户端必须先通过生成的结构守卫，再保存令牌或进入 Logic 包。

## 存储和语义转换

| 微信/领域值 | Wire 类型 | 转换或语义 |
| --- | --- | --- |
| `openid` | 不下发 | 保存为微信第三方身份绑定键 |
| `unionid` | 不下发 | 当前不参与账号定位；未来跨应用绑定另立契约 |
| `nickName` | `nickname: string` | 有可验证资料时保存；否则使用账号默认昵称；登录成功时返回 |
| `avatarUrl` | `avatar: string` | 有可验证资料时保存；否则使用默认头像标识；登录成功时返回 |
| `session_key` | 不下发 | 仅用于本次服务端资料解密，之后不记录 |
| 数据库账号 ID | `userId: string` | Login Server 生成，Central/Gateway 后续使用 |

## 错误

| 错误码 | 含义 | 可重试性 |
| --- | --- | --- |
| `INVALID_REQUEST` | 字段、长度或组合不合法 | 修正请求后 |
| `LOGIN_METHOD_DISABLED` | 登录方式未启用 | 否 |
| `WECHAT_CONFIG_MISSING` | 服务端缺少或配置了无效的 AppID/AppSecret | 配置后 |
| `WECHAT_CODE_INVALID` | 微信 code 无效、过期、缺失或已使用 | 重新 `wx.login` |
| `WECHAT_CODE_BLOCKED` | 微信风控拦截 | 按平台提示 |
| `WECHAT_RATE_LIMITED` | 微信接口限流 | 延迟重试 |
| `WECHAT_UPSTREAM_ERROR` | 微信接口或网络暂时失败 | 可重试 |
| `WECHAT_PROFILE_INVALID` | 加密资料、AppID 水印或身份不匹配 | 重新授权登录 |
| `CENTRAL_SESSION_FAILED` | Central 会话注册失败 | 可重试 |
| `GATEWAY_ASSIGNMENT_FAILED` | Gateway 分配失败 | 可重试 |

错误响应不得透出微信原始 `errmsg`、密钥、堆栈或内部地址。

## 版本和兼容

这是 HTTP 登录负载的首个机器契约版本。客户端与 Login Server 必须在同一发布窗口升级；Local 开发登录保留，但 Test/Production 不保留旧的固定 code 绕过。新增字段默认只能是可选字段；改变身份键、必填资料或成功字段属于不兼容变更，必须提升契约版本并明确升级顺序。

## Fixtures

- `fixtures/wechat-request.json`：真实微信登录请求。
- `fixtures/developer-request.json`：仅 Local/Test 联调允许的开发请求。
- `fixtures/success-response.json`：完整成功响应。
- `fixtures/error-response.json`：稳定失败响应。

双端测试必须解析同一组 fixtures；fixture 中不得放真实 code、openid、token、AppID 或用户资料。

## 部署秘密

Login Server 从 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 环境变量读取微信应用凭据。AppSecret 一旦在聊天、日志、提交或截图中明文出现，应先在微信后台重置，再配置新值；文档只记录变量名和设置方式，不记录实际值。

官方依据：[小程序登录凭证校验（同时适用于小游戏）](https://developers.weixin.qq.com/miniprogram/dev/server/API/user-login/api_code2session.html)、[小游戏 wx.getUserInfo](https://developers.weixin.qq.com/minigame/dev/api/open-api/user-info/wx.getUserInfo.html)、[小游戏 UserInfoButton](https://developers.weixin.qq.com/minigame/dev/api/open-api/user-info/wx.createUserInfoButton.html)。

## 验收

- 协议生成器覆盖 Start 与 Login Server，fixtures、生成物和漂移检查通过。
- Login Server 测试覆盖有资料成功、无资料成功、缺配置、无效 code、风控、限流、解密失败、AppID/openid 不匹配、重复和并发账号解析。
- 客户端静态检查通过；微信环境默认不显示账号输入并自动登录，显式强制账号模式可在 Local/Test 回到输入界面；资料权限或资料 API 失败不阻断登录。
- 微信开发者工具使用真实 AppID、重置后的 AppSecret 和 Test HTTPS 地址完成两次登录，确认同一微信身份得到同一 `userId`；无资料时返回默认资料，有已验证资料时正确更新昵称头像。
