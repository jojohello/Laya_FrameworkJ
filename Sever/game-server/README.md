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
