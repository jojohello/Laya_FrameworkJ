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

Current handlers include login and player-info examples. They are framework scaffolding, not a complete server-authoritative player, item, bag, or room system.

Game configuration is loaded by `ConfigManager` and `JsonTableLoader`; local package rules are documented beside those classes.
