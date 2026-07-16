# Server Architecture

## Scope

This document owns contracts shared by two or more server modules. Service-local implementation decisions belong in the nearest module `DESIGN.md`.

## Topology

```text
Client
  | REST login
  v
Login Server (8081) ---> Central Data Server (8083)
  | returns account, token, timestamp, Gateway address
  v
Gateway Server (8082) <==== WebSocket ====> Game Server (8084)
  |                              |
  +------ client sessions -------+------ game message handling
```

The Central Data Server is the authority for accounts, sessions, Gateway allocation, and server registry. The Gateway is the public persistent-connection boundary. The Game Server never accepts a client connection directly.

## Identity Boundaries

- `userId`: account identity. It is used by login, authentication, session ownership, and network routing until a role is selected.
- `playerId`: game-role identity. Game state, inventory, progression, and room membership must use it once the role system exists.
- `sessionId`: one physical Gateway connection.
- `gatewayId` and `gameServerId`: service-instance identities.

Do not silently use `userId` as permanent game-role identity. The current code still does this in parts of `game-server`; the migration is tracked in the current Plan.

## Login And Message Flow

1. Client calls Login Server.
2. Login Server authenticates the platform identity and creates or resolves the Central account/session.
3. Central allocates an available Gateway and records the waiting connection.
4. Client connects to Gateway and submits `userId`, login timestamp, and token.
5. Gateway validates all three factors through Central before accepting business traffic.
6. Gateway attaches routing fields and forwards business messages to Game Server over WebSocket.
7. Game Server dispatches by message ID and returns a response or broadcast through Gateway.

Tokens are authentication material and must not be forwarded with ordinary game messages or written to logs.

## Service Lifecycle

Gateway and Game Server report to Central every 5 seconds. Central treats 15 seconds without heartbeat as offline and checks at 5-second intervals. Services actively unregister during graceful shutdown; timeout detection is the fallback.

Central pushes Game Server status changes to Gateways. Polling the registry is a recovery path, not the primary discovery mechanism.

## Module Boundaries

- `common` contains code genuinely shared by multiple modules; it must not depend on a concrete service.
- Controllers and WebSocket handlers adapt transport only. Business decisions belong in services, registries, routers, or handlers.
- Cross-service DTOs and message fields form versioned contracts. Change producers, consumers, and tests together.
- Runtime configuration is externalizable. Secrets must come from environment or secret management in production.
- Generated deployment output is not source of truth.

## Data And Concurrency

Central owns durable account/session/allocation data. Game Server owns gameplay state and may use Redis for hot state and routing. In-memory maps are instance-local caches and must not be treated as cluster-wide truth.

WebSocket callbacks, scheduled heartbeats, and message executors run concurrently. Shared mutable state requires concurrent collections or explicit synchronization, and blocking I/O must not run on connection callback threads.

## Error Prevention

- Confirm ports and endpoints from `application.yml` and handler registration before documenting them.
- Distinguish SockJS endpoints from native WebSocket endpoints; game clients use `/ws/native` on Gateway.
- A cross-service protocol change is complete only after the producer, every forwarding boundary, the consumer, and the client handler use the same message ID, scope, envelope, field types, and error semantics.
- Gateway authentication is an explicit state transition. Business messages must not be forwarded before three-factor validation succeeds, and clients must not replace the acknowledgement with a fixed delay.
- Use one JSON serializer configuration for protocol preflight and the actual WebSocket write. Validate the exact final envelope; Java maps with numeric keys must become legal JSON object keys or be represented as an entry list.
- Error responses must retain actionable fields across forwarding layers. Do not discard `code`, `message/reason`, or the original message ID while adapting an envelope.
- Verify endpoint paths and HTTP methods at both caller and controller. A `405` confirm or `404` disconnect is a contract defect even when login currently appears successful.
- Build affected Maven modules with `-am` from the aggregate project. Before accepting a result, run a clean compile at least once so stale `target/classes` cannot hide missing dependencies or source errors.
- Do not run `mvn clean` underneath a live IDE debug process that loads classes from `target/classes`; stop and fully restart the service after a clean build to avoid partial DevTools classloaders.
- Redis/cache DTOs must survive a serialize-deserialize round trip. Computed boolean getters are ignored unless they are intentional persisted fields, and unknown-field behavior must be explicit.
- Never infer completion from an old checklist. Confirm classes, wiring, runtime behavior, and tests.
- Do not claim production readiness while test coverage is absent or secrets have insecure defaults.
- Keep source comments and documentation in UTF-8 without BOM and LF; do not bulk-rewrite generated artifacts.
- Every service entry point must call the shared `Utf8Console.configure()` before Spring and logging initialization. This keeps Chinese console output UTF-8 under IDE, Maven, and packaged-JAR startup instead of relying only on launcher-specific JVM flags.
- VS Code launch and task configurations must keep `logging.charset.console`, `stdout.encoding`, and `stderr.encoding` on UTF-8. A command-line `GBK` override takes precedence over `application.yml` and corrupts SLF4J output in the UTF-8 integrated terminal.
