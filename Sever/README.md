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

## 开发环境首次启动

Prerequisites are JDK 21 or newer, Maven, MySQL 8, and Redis or a Redis-compatible local service. A Git checkout does not include database binaries. Builds must keep the Maven compiler release at 21; Java 25 class files are not compatible with Spring Boot 3.2.0's component-scanning ASM.

1. From the repository root, inspect the environment:

   ```powershell
   powershell -ExecutionPolicy Bypass -File tools/bootstrap/check-development-environment.ps1
   ```

2. Start MySQL and Redis using the commands supplied by the local installation. If the repository-local Windows services were installed previously, run an elevated PowerShell:

   ```powershell
   Start-Service -Name LayaMySQL,LayaRedis
   ```

   `Sever/install-database-services.ps1` only registers binaries already present under `Sever/output/data/local-databases`; those binaries are not part of a fresh Git checkout.

3. Initialize empty development databases from the `Sever` directory. The command prompts for the local MySQL root password:

   ```powershell
   cmd /c "mysql -u root -p < scripts\setup-database.sql"
   ```

   The checked-in local defaults use `root/root` for Central and `laya_user/laya123456` for Login/Game. Adjust environment configuration when the local installation uses different credentials. These defaults are development-only and must not be reused in a deployed environment.

4. Build and test:

   ```powershell
   mvn clean test
   ```

5. Start each service in a separate terminal, in dependency order:

   ```powershell
   mvn -pl central-data-server spring-boot:run
   mvn -pl login-server spring-boot:run
   mvn -pl gateway-server spring-boot:run
   mvn -pl game-server spring-boot:run
   ```

6. From the repository root, require all automatable services:

   ```powershell
   powershell -ExecutionPolicy Bypass -File tools/bootstrap/check-development-environment.ps1 -RequireServices
   ```

7. Open `Client/LayaProject` in LayaAir IDE 3.3, run the startup scene, use a development account, and confirm that login reaches the main scene. This manual client observation plus the four server health checks is the first-use end-to-end acceptance.

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

An automated process-level login/Gateway/Game smoke test is still planned. Do not describe health endpoints alone as proof of the complete identity and connection lifecycle; first-use acceptance currently includes the manual LayaAir login described above.
