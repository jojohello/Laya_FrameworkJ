# Gateway Server Design

## Responsibility

Gateway is a transport and routing boundary. It authenticates connections, owns session-to-account mappings, and forwards messages; it must not implement gameplay rules.

## Connection Lifecycle

1. Central places `userId` in the Gateway waiting set during allocation.
2. Client opens `/ws/native` and sends account, login timestamp, and token.
3. Gateway checks the waiting set and asks Central to validate all three factors.
4. On success, Gateway binds `sessionId` to `userId`, removes the waiting entry, and accepts business messages.
5. Business messages are enriched with routing data and sent to a connected Game Server.

The current disconnect path removes the live session immediately. Reconnect retention and duplicate-login policy are intentionally unfinished and tracked at the Server root.

## Routing And Concurrency

- `GatewayWebSocketHandler` owns client connection callbacks and response delivery.
- `GameServerConnectionManager` owns internal Game Server connections.
- `CentralHeartbeatService` and `CentralServerClient` own Central lifecycle traffic.
- Session maps are concurrent state. A user/session replacement must be atomic and have an explicit close reason.

Do not block WebSocket callback threads on gameplay work. Do not trust routing fields supplied by an unauthenticated client.

Message scope comes from `Protocol/message-ids.yaml`. Gateway handles only `gateway`-scoped messages locally. Every other message from an authenticated session is forwarded to Game Server without a gameplay allowlist; unknown business IDs are rejected by Game Server, not Gateway. Before forwarding, Gateway must overwrite `userId`, `sessionId`, and `gatewayId` from trusted session state after copying client data so those routing fields cannot be spoofed.

## Lifecycle

Gateway heartbeats Central every 5 seconds and actively unregisters during graceful shutdown. Central timeout detection is the fallback. Registry-change callbacks should update Game Server connections; polling is recovery behavior.
