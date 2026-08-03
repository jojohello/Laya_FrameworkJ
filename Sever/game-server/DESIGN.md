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

- Each Game Server instance owns one private MySQL database, selected by `GAME_DB_NAME` and bound to its `GAME_SERVER_ID`. The development default for `game-server-1` is `laya_game_1`.
- `playerId` auto-increment uniqueness is local to that database. Cross-server tools and records must carry both `gameServerId` and `playerId`.
- Flyway under `classpath:db/migration` is the schema authority. New tables and columns must be migrations; repositories only read and write runtime data.
- `playerId`, experience, and wallet balances use decimal strings on the JSON wire. Server storage remains `BIGINT` and Java `long` while checked arithmetic proves the configured domain fits signed 64-bit.
- Bounded counts such as inventory stacks may remain JSON numbers only when the server enforces `0..Number.MAX_SAFE_INTEGER`.
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

Activation conditions are server-authoritative. The first time they match, the guide is persisted as `queued` with an activation order. The unfinished queue is FIFO; only its head may transition to `inProgress`. Client-only restriction conditions such as scene, UI, and dialog readiness decide when the queued head may start, but cannot activate or reorder guides.

`player_guide_state` stores one row per player and guide with `queued/inProgress/completed`, activation order, monotonic `currentStepId`, and script version. Network handlers resolve authenticated `userId` to the selected `playerId` before repository access. Completed progress is idempotent and cannot be rolled back. Guide actions never grant gameplay state directly; level-up and other mutations continue through their normal validated handlers.

## Battle settlement

`BATTLE_ENTER_REQUEST` creates a `player_battle_session` owned by the authenticated `playerId`.
`BATTLE_COMPLETE_REQUEST` locks that session, reads `BattleStage.victoryRewards`, writes its immutable
`reward_snapshot`, and grants currency through `WalletRepository` or ordinary items through `BagService`
inside the same transaction. The first successful settlement returns one versioned bag delta. A completed
session returns its recorded rewards, current wallet, and current bag snapshot instead of granting again. The
response is the only client source for the victory reward display, wallet refresh, and reward-driven bag change.

The current client-side battle simulation can report victory, so this session contract establishes ownership,
configuration authority and idempotency but is not anti-cheat proof. Do not treat client-reported victory as a
production trust boundary; replace it with server simulation or a server-verifiable combat report before release.

## Bag authority

`BagService` is the only gameplay mutation boundary for ordinary inventory items. It locks
`player_container_state`, validates item definitions and stack-based capacity, computes absolute counts with
checked arithmetic, persists a batch atomically, and increments the bag version exactly once. Handlers obtain
the owner from `MessageContext.playerId`; payloads never choose an owner, capacity, final count, or version.

`BagService` and `BagRepository` are stateless Spring singletons, not per-player managers. Every operation is
keyed by `(playerId, BagType)`. Each player therefore has one logical bag manager with reusable container
instances: `main` and `warehouse` share code but have isolated rows, capacity, items, locks, and versions.
Battle rewards always target `main`. Login/reconnect eagerly serializes only `main`; `warehouse` is lazy-loaded
through the typed snapshot request. Adding another one-per-player container requires extending the generated
enum and capacity policy, not copying service/repository code.

Snapshots are used for login, reconnect, explicit recovery, and duplicate battle completion. Deltas are used
for the first successful battle reward settlement. The shared wire contract and fixtures live under
`Protocol/contracts/bag`; local code must not define a competing payload contract.

`BagPayloads` is generated from `Protocol/contracts/bag/schema.json` and is the only Java wire DTO for this
feature. Bag domain services may use internal state records, but handlers, initialization sections, and battle
response fragments must expose generated payload records rather than handwritten transport classes.
