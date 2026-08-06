# Gateway lifecycle contract

Central Data Server owns gateway allocation state. Gateway reports only lifecycle facts for the socket that it currently owns.

- `PUT /api/v1/gateway/confirm-connection` confirms an `ALLOCATED` record as `CONNECTED`. Repeating the same confirmation for the same gateway is successful.
- `DELETE /api/v1/gateway/release` recycles the current `ALLOCATED` or `CONNECTED` record. Repeating a release after it was recycled is successful.
- `DELETE /api/v1/gateway/unregister` marks the Gateway registry entry offline during graceful shutdown. Repeating it or unregistering an absent entry is successful; heartbeat timeout remains the abnormal-exit fallback.
- Both calls carry `userId`, `gatewayIp`, and `gatewayPort`; Central rejects a gateway identity that does not match the allocation.
- A replaced WebSocket session must not send a release notification. Gateway may release only after atomically proving that the closing session is still the user's current session.
- Transport success is not business success. Gateway must check the response `success` field before completing client authentication.

Request and response fields are generated from `schema.json`; handwritten competing DTOs are not allowed.
