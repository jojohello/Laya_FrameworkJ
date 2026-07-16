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
