# Login Server

Login Server is the HTTP entry for account authentication. It supports guest, test-pass, and WeChat authentication implementations, records login activity, issues login credentials, and asks Central Data Server for account/session and Gateway information.

## Run

Default port: `8081`.

```powershell
mvn -pl login-server spring-boot:run
```

Main endpoints:

- `POST /api/login`
- `GET /api/login/methods`
- `GET /api/health`
- `GET /api/gameserver/list`
- `GET /api/gameserver/gateway/{userId}`

Configuration is in `src/main/resources/application.yml`. Real platform credentials and JWT secrets must be supplied outside source for production.

## WeChat credentials

真实微信登录使用微信 `code2Session`。处理真实微信登录请求前必须设置以下服务端环境变量：

```powershell
$env:WECHAT_APP_ID="<微信小游戏 AppID>"
$env:WECHAT_APP_SECRET="<微信后台重置后取得的新 AppSecret>"
$env:WECHAT_DEVELOPER_CODE_ENABLED="false"
```

AppSecret 只允许存在于服务器环境或秘密管理系统，不得写入 `application.yml`、客户端、启动脚本、日志、截图、fixture 或 GitHub。若 AppSecret 曾在聊天、日志或提交中明文出现，必须先在微信后台重置，再配置新值。

Login Server 只读取启动进程继承到的环境变量，不读取 Windows 注册表或文件兜底。机器级环境变量不会自动注入已经运行的 VS Code 或终端；修改后必须重启 IDE/终端，或先在新的 PowerShell 中载入当前进程再启动服务（命令不会输出 Secret）：

```powershell
$env:WECHAT_APP_ID = [Environment]::GetEnvironmentVariable("WECHAT_APP_ID", "Machine")
$env:WECHAT_APP_SECRET = [Environment]::GetEnvironmentVariable("WECHAT_APP_SECRET", "Machine")
mvn -pl login-server spring-boot:run
```

真实微信账号只依赖 `wx.login` code 和服务端 `code2Session` 返回的 `openid`。昵称头像资料为可选展示信息：没有授权时照常登录并使用默认资料；请求带有成对的 `profileEncryptedData/profileIv` 时才解密校验并更新资料。已有历史账号若昵称或头像为空，会在登录时补齐默认资料，确保成功响应始终符合生成契约。

缺少微信 AppID/AppSecret 时 Login Server 仍会启动，游客和显式开启的本地开发登录不受影响；真实微信请求会返回稳定的 `WECHAT_CONFIG_MISSING`。Test/Production 部署不得把可启动误判为可发布，必须在对外开放前检查真实微信配置完整。

当前本机 Login Server 已分别通过 LayaAir IDE 账号登录和微信开发者工具真实微信自动登录验证；两条路径均可完成 Gateway 认证并进入游戏。真实微信重复登录返回同一 `userId`，客户端重新进入后的玩家名称和背包数据一致。

Local/Test 固定 code 联调不需要真实微信凭据，但必须显式开启且只对当前进程生效：

```powershell
$env:WECHAT_DEVELOPER_CODE_ENABLED="true"
mvn -pl login-server spring-boot:run
```

Production 不得设置 `WECHAT_DEVELOPER_CODE_ENABLED=true`。真实模式缺少 AppID/AppSecret 时只拒绝微信登录请求，不会回退到开发凭据。

The Login database defaults to `laya_login` and is configured with `LOGIN_DB_HOST`, `LOGIN_DB_PORT`, `LOGIN_DB_NAME`, `LOGIN_DB_USERNAME`, and `LOGIN_DB_PASSWORD`.
