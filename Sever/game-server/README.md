# Game Server

Game Server receives authenticated business messages from Gateway, dispatches them by message ID, and sends responses or broadcasts back through the originating Gateway. It also provides Redis helpers and JSON configuration-table loading.

## Run

Default port: `8084`.

```powershell
mvn -pl game-server spring-boot:run
```

Main entry points:

- Gateway WebSocket: `ws://localhost:8084/ws/gateway`
- Actuator health: `/actuator/health`

Current gameplay handlers include unified initialization, player level-up, FunctionOpen, and Guide progress. Guide eligibility and progress are server-authoritative, while concrete UI flow files remain client assets. Inventory and room systems are still incomplete framework work.

Account login uses `userId` for authentication and routing. On first Game Server login, an account with no role receives a default role named from `Player + millisecond timestamp + random digits`; an account with exactly one role automatically selects it. Character state is stored by the server-generated `playerId` and the wire format exposes that ID as a string. Multi-role list and explicit selection are reserved for the next role-system phase.

Game configuration is loaded by `ConfigManager` and `JsonTableLoader`; local package rules are documented beside those classes.

Each Game Server uses its own gameplay database. `game-server-1` defaults to `laya_game_1`; deployments must explicitly provide `GAME_SERVER_ID` together with `GAME_DB_HOST`, `GAME_DB_PORT`, `GAME_DB_NAME`, `GAME_DB_USERNAME`, and `GAME_DB_PASSWORD`. Flyway creates or upgrades gameplay tables on startup.

## Exact numeric fields

Player IDs, experience, and wallet balances are serialized as decimal strings. `ExactLong` provides checked non-negative addition and wire conversion. Inventory counts remain JSON numbers only because the repository rejects values above JavaScript's safe-integer limit.

When a new property may become very large:

1. Keep identity components separate instead of packing them into one integer.
2. Use checked `long/BIGINT` while the domain fits signed 64-bit.
3. Send the value as a decimal string and use client `bigint`.
4. If the domain explicitly exceeds 64-bit, migrate only that column to `BigInteger/DECIMAL(65,0)`; keep the same string wire contract.
