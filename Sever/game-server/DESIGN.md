# Game Server Design

## Responsibility

Game Server owns gameplay message dispatch and gameplay state. It accepts only internal Gateway WebSocket connections; clients never connect directly.

## Message Path

`GatewayWebSocketHandler` receives an internal message, `GatewayMessageHandler` adapts it, and `MessageRouter` dispatches by message ID to a `MessageHandler`. `MessageContext` carries network identity and reply routing. Responses use `GatewayRouteManager` and the matching Gateway connection.

Transport fields such as `sessionId`, `userId`, and `gatewayId` stay outside business payloads. Handlers must not trust a token in a gameplay message; authentication was completed at Gateway.

## Identity

`userId` currently serves account routing and some placeholder gameplay storage. This is transitional. New gameplay systems must use `playerId` after role selection, while network routing continues to use `userId` or `sessionId` as required.

Do not add a server-authoritative inventory keyed ambiguously by account ID. Establish the Account-to-Player contract first.

## Data And Configuration

- `RedisService` is hot-state infrastructure; keys must encode ownership and identity type explicitly.
- `GatewayRouteManager` caches user-to-Gateway routes in memory and Redis.
- `ConfigManager` preloads JSON tables and fails fast on invalid required configuration.
- Config structure classes are read models for table data; they are not runtime player state.

## Concurrency

Gateway connections, incoming messages, heartbeat scheduling, and response sends are concurrent. Message handling may use executors, but ordering requirements must be explicit per player or subsystem. Avoid mutable singleton state without ownership or synchronization.

## Lifecycle

Game Server heartbeats Central every 5 seconds, actively unregisters during graceful shutdown, and exposes `/ws/gateway` for Gateway connections. Reported connection and online-player counts must come from live managers rather than placeholders before they are used for balancing.
