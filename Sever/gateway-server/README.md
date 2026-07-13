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
