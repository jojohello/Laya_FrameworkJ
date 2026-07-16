# Game Server Design

## Responsibility

Game Server owns gameplay message dispatch and gameplay state. It accepts only internal Gateway WebSocket connections; clients never connect directly.

## Message Path

`GatewayWebSocketHandler` receives an internal message, `GatewayMessageHandler` adapts it, and `MessageRouter` dispatches by message ID to a `MessageHandler`. `MessageContext` carries network identity and reply routing. Responses use `GatewayRouteManager` and the matching Gateway connection.

Transport fields such as `sessionId`, `userId`, and `gatewayId` stay outside business payloads. Handlers must not trust a token in a gameplay message; authentication was completed at Gateway.

## Identity

`userId` is the account identity produced by platform/account login. It is used for authentication, account operations and network routing; it is never the ownership key of character gameplay data.

`playerId` is the Game Server character identity. MySQL generates it from `player_role.player_id BIGINT AUTO_INCREMENT`; JSON responses serialize it as a string so JavaScript never loses integer precision. One `userId` may own multiple `playerId` values.

The first role-selection version creates a default role when the account has none and automatically selects the role when exactly one exists. More than one role requires an explicit selection protocol and must not trigger full gameplay initialization. Character summaries used by that future list contain appearance/list fields only, not wallet, bag or other complete state.

Player level, experience, stamina, wallet, inventory, FunctionOpen, Guide and future gameplay state are keyed by `playerId`. Network responses still route through authenticated `userId` or `sessionId`; transport identity and gameplay ownership must not be conflated.

The account-keyed development tables are migration sources only. Each migration records a key in `game_schema_migration` and must never replay on every startup; retained legacy tables are read-only until row-count reconciliation permits deletion.

## Data And Configuration

- `RedisService` is hot-state infrastructure; keys must encode ownership and identity type explicitly.
- `GatewayRouteManager` caches user-to-Gateway routes in memory and Redis.
- `ConfigManager` preloads JSON tables and fails fast on invalid required configuration.
- Config structure classes are read models for table data; they are not runtime player state.

## Concurrency

Gateway connections, incoming messages, heartbeat scheduling, and response sends are concurrent. Message handling may use executors, but ordering requirements must be explicit per player or subsystem. Avoid mutable singleton state without ownership or synchronization.

## Lifecycle

Game Server heartbeats Central every 5 seconds, actively unregisters during graceful shutdown, and exposes `/ws/gateway` for Gateway connections. Reported connection and online-player counts must come from live managers rather than placeholders before they are used for balancing.

## Guide Authority

Guide eligibility is server-authoritative. `GuideConfig` supplies the shared trigger type and arguments; polymorphic `GuideCondition` implementations evaluate gameplay state, while UI readiness remains client-only.

`player_guide_state` stores one row per player and guide with `inProgress/completed`, monotonic `currentStepId`, and script version. Network handlers resolve authenticated `userId` to the selected `playerId` before repository access. A client must establish `inProgress` while the trigger is valid before reporting later steps. Completed progress is idempotent and cannot be rolled back. Guide actions never grant gameplay state directly; level-up and other mutations continue through their normal validated handlers.
