# Framework-J Server

Framework-J's server side is a Java 21 bytecode target and Spring Boot 3.2 multi-module project. It provides login, session and gateway allocation, client connection proxying, and game-message routing.

## Active Services

| Module | Port | Responsibility |
| --- | ---: | --- |
| `login-server` | 8081 | Third-party or guest login, account records, token issuance, and gateway lookup |
| `gateway-server` | 8082 | Client WebSocket entry, three-factor validation, sessions, and message forwarding |
| `central-data-server` | 8083 | Users, sessions, gateway allocation, and service registry |
| `game-server` | 8084 | Game-message dispatch, Gateway connections, routing, Redis access, and config loading |
| `common` | n/a | Shared utilities and dependencies |

`database-server` is currently a placeholder and is not included by the parent `pom.xml`.

## Start

Prerequisites are JDK 21 or newer, Maven, Redis, and any database required by the selected profile. Builds must keep the Maven compiler release at 21; Java 25 class files are not compatible with Spring Boot 3.2.0's component-scanning ASM.

```powershell
mvn clean package
```

Start services in dependency order:

```powershell
mvn -pl central-data-server spring-boot:run
mvn -pl login-server spring-boot:run
mvn -pl gateway-server spring-boot:run
mvn -pl game-server spring-boot:run
```

Runtime settings are in each module's `src/main/resources/application.yml`. The four ports above are the checked-in defaults.

## Local Databases On Windows

The repository-local development installation uses MySQL 8.0.46 and Memurai 4.1.7 (Redis API 7.2 compatible). They are registered as the `LayaMySQL` and `LayaRedis` Windows services with `Manual` startup, so neither starts with Windows.

Double-click `start-databases.bat` before development and `stop-databases.bat` afterward. Both scripts request administrator permission to control the services. MySQL listens only on `127.0.0.1:3306`, and Redis listens only on `127.0.0.1:6379`.

The checked-in development credentials are `root/root` and `laya_user/laya123456`. The local databases are `laya_login`, `laya_central_dev`, and `laya_game_1`. These credentials are development-only and must not be reused in a deployed environment.

## Main Entry Points

- Login: `POST http://localhost:8081/api/login`
- Client Gateway WebSocket: `ws://localhost:8082/ws/native`
- Gateway health: `GET http://localhost:8082/api/gateway/health`
- Central health: `GET http://localhost:8083/actuator/health`
- Game Gateway WebSocket: `ws://localhost:8084/ws/gateway`

Detailed service behavior lives in each module's `README.md`. Cross-service constraints live in `DESIGN.md`.

## Verification

```powershell
mvn test
powershell -ExecutionPolicy Bypass -File tools/docs/validate-doc-system.ps1
```

### Cross-service smoke test

A process-level smoke test exercises the identity and connection lifecycle across real HTTP and WebSocket boundaries. It performs a guest login against Login Server, opens the native Gateway WebSocket, completes three-factor authentication (validated through Central), sends a 2001/2002 heartbeat, routes business messages LOGIN(101), GAME_INIT_REQUEST(105), and BAG_SNAPSHOT_REQUEST(5001) through Gateway to Game Server, confirms the connection, and disconnects cleanly. The test connects to configurable service addresses (env-overridable `SMOKE_LOGIN_URL` / `SMOKE_GATEWAY_WS`, defaults `localhost:8081`-`8084`) so it runs against already-started services rather than self-bootstrapping four Spring Boot processes. It does not replace `mvn test` for unit and contract coverage.
