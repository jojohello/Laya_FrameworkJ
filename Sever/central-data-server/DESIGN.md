# Central Data Server Design

## Responsibility

Central Data Server owns shared identity and lifecycle truth. Other services may cache its decisions but must not create competing account, session, allocation, or registry authorities.

## Components

- User and session controllers/services manage account records and login-session validation.
- `GatewayService` manages allocation and waiting-connection handoff.
- `GatewayHeartbeatService` tracks Gateway liveness.
- `GameServerRegistry` tracks Game Server liveness and emits change notifications.
- `CentralWebSocketHandler` supports service and account-level WebSocket interactions.

## Registry Rules

Gateway and Game Server heartbeat every 5 seconds. A 15-second silence marks an instance offline; checks run every 5 seconds. Active unregister is preferred on shutdown. State changes are pushed to interested Gateways, with list queries available for recovery.

Registry identity is an instance identity. Do not key a multi-instance registry only by service type or host without port/instance ID.

## Data And Security

- `userId` is account identity and owns login sessions and Gateway allocation.
- Token validation compares protected token material and login timestamp; raw tokens must not appear in logs.
- Production service authentication and JWT secrets must be external values with no usable fallback.
- In-memory repositories or caches are development choices and cannot provide cluster-wide durability.

Profile-specific datasource, Redis, cache, and security behavior must remain explicit in configuration and tests.
