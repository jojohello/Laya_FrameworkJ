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

After three-factor validation, Gateway confirms the allocation with Central before returning `AUTH_SUCCESS`. Connection confirmation and release use the generated `Protocol/contracts/gateway-lifecycle` payloads. The advertised identity comes from `GATEWAY_IP` and `GATEWAY_PORT` (with local development fallbacks); it must match the address allocated by Central.

When a new socket replaces an existing socket for the same user, cleanup of the old socket does not release the new socket's allocation.

On graceful shutdown Gateway calls `DELETE /api/v1/gateway/unregister` with its advertised IP and port so Central marks it offline immediately. The operation is idempotent; Central heartbeat timeout remains the abnormal-exit fallback.

Gateway locally handles only protocols marked `scope: gateway` in `Protocol/message-ids.yaml`. Authenticated non-Gateway messages are transparently forwarded to Game Server, so adding a normal gameplay MessageID does not require a Gateway code change or deployment.

## Client heartbeat

- Client sends `2001 (HEARTBEAT)` every 5 seconds after authentication.
- Gateway handles it locally and replies with `2002 (HEARTBEAT_RESPONSE)`; neither message is forwarded to Game Server.
- `laya.heartbeat-timeout` is currently 15 seconds and `laya.check-interval` controls timeout scan frequency. Keep the client interval strictly below the timeout and verify both ends whenever either value changes.
