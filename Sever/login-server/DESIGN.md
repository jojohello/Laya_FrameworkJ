# Login Server Design

## Responsibility

Login Server translates a platform credential into an account-level login result. It owns platform authentication adapters and login records; Central Data Server remains authoritative for shared user/session state and Gateway allocation.

Login Server owns a platform/environment-level database, default development name `laya_login`. It stores account identities, third-party bindings, and login records only. Gameplay roles and progression must never be written to this database.

## Boundaries

- `LoginController` adapts HTTP requests and responses.
- `LoginService` coordinates authentication, account resolution, token creation, and Central calls.
- `ThirdPartyAuthService` implementations isolate guest, test, WeChat, or future platform verification.
- `CentralDataService` and `CentralWebSocketClient` contain Central integration.

Do not place gameplay role creation or game-state loading in this service. The returned `userId` is an account identity, not a role identity.

## Security

- Production platform verification must call the real provider and reject test bypasses.
- JWT and service-auth secrets must be externally supplied and rotated independently.
- Never log raw platform codes, passwords, JWTs, or full session tokens.
- 生产源码不得暴露创建测试账号的 HTTP Controller。`LoginRecord` 及其 Builder 的字符串表示必须脱敏 token、设备信息和客户端地址，防止异常日志间接泄密。
- Login success is not Gateway authentication; Gateway independently validates the account, timestamp, and token with Central.
- 微信账号以服务端 `code2Session` 返回的 `openid` 作为第三方绑定键，项目生成的 `userId` 仍是账号权威；可选 `unionid` 不作为当前登录前提。
- 微信昵称头像是可选展示资料，不能参与认证或授权。未提供时只凭 `code2Session` 的 `openid` 登录并使用默认资料；提供时必须来自本次会话解密结果，并校验 `watermark.appid` 与 `openid`。
- `(third_party_type, third_party_user_id)` 是账号绑定唯一键。并发创建冲突必须先结束失败的创建事务，再重新读取唯一键对应的胜出账号，不能让同一平台身份偶发登录失败。
- `WECHAT_APP_ID` 与 `WECHAT_APP_SECRET` 只从服务端环境读取。缺少任一变量时只禁用真实微信请求并返回稳定的 `WECHAT_CONFIG_MISSING`，不得阻止 Login Server 启动或影响其他认证适配器；Test/Production 部署验收必须在对外开放前确认配置完整。固定开发 code 还要求仅在 Local/Test 联调进程显式设置 `WECHAT_DEVELOPER_CODE_ENABLED=true`，Production 必须关闭。
- `code2Session` 诊断日志只允许记录微信数值 `errcode` 和项目定义的安全分类。不得记录原始 code、AppSecret、带查询参数的请求 URL、原始响应或微信 `errmsg`。
- Login Server 与 Central 的成功心跳包不写日志；发送失败、传输错误、断连和重连仍必须保留，以免静默掩盖服务异常。
- IDE 源码调试必须显式使用 classpath 内的 `application.yml`，不得让 `output/servers/login-server/application.yml` 的旧部署副本覆盖当前源码配置。部署副本纳入版本管理时必须与源码配置同步；环境变量变更后必须重启承载 Java 调试进程的 IDE 或终端，使新进程真正继承变量。
- 微信认证适配器只允许通过 `System.getenv` 从 Login Server 进程环境读取 `WECHAT_APP_ID`、`WECHAT_APP_SECRET` 和 `WECHAT_DEVELOPER_CODE_ENABLED`，不得经过 Spring 属性优先级，也不读取注册表、文件或命令行中的凭据兜底。
- Spring 启动失败或服务关闭后，Central WebSocket 的异步连接完成、传输回调和断连回调不得再启动心跳或安排重连。关闭边界必须同时终止连接执行器和调度器，并静默关闭竞态中迟到的会话。
