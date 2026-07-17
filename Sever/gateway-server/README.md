# Gateway Server

Gateway Server owns public client WebSocket sessions. It validates new connections with Central Data Server, tracks waiting users, forwards authenticated business messages to Game Server, and routes responses back to client sessions.

## Run

Default port: `8082`.

```powershell
mvn -pl gateway-server spring-boot:run
```

Main entry points:

- Native client WebSocket: `ws://localhost:8082/ws/native`
- SockJS client endpoint: `/ws`
- Health: `GET /api/gateway/health`
- Status: `GET /api/gateway/status`
- Waiting connection: `POST /api/gateway/waiting-connection`

Gateway connects to Game Server as an internal WebSocket client and receives Central registry-change callbacks.

Gateway locally handles only protocols marked `scope: gateway` in `Protocol/message-ids.yaml`. Authenticated non-Gateway messages are transparently forwarded to Game Server, so adding a normal gameplay MessageID does not require a Gateway code change or deployment.

## Client heartbeat

- Client sends `2001 (HEARTBEAT)` every 5 seconds after authentication.
- Gateway handles it locally and replies with `2002 (HEARTBEAT_RESPONSE)`; neither message is forwarded to Game Server.
- `laya.heartbeat-timeout` is currently 15 seconds. Keep the client interval strictly below this timeout and verify both ends whenever either value changes.
