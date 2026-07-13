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
