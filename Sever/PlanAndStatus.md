# Current Server Plan

## Objective

Establish a testable identity and connection lifecycle before adding more server-authoritative gameplay systems.

## Completed

- [x] Fix GatewayService.getGatewayLoadInfo() ClassCastException: Long cannot be cast to Integer. The repository aggregates by canonical "ip:port" key and returns a 2-tuple [String key, Long count], but the consumer was casting it as a 3-tuple [String ip, Integer port, Long load]. This caused every gateway allocation to fail after the first CONNECTED record existed, producing alternating LayaIDE/WX success/failure patterns. The consumer now reads the tuple shape correctly.

## Work Order

- [ ] Add a process-level smoke test that starts the participating services and exercises login, three-factor Gateway authentication, Gateway-to-Game routing, heartbeat expiry, graceful unregister, connection confirmation and disconnect through real HTTP/WebSocket boundaries.
- [ ] Move Login Server schema management from Hibernate ddl-auto=update to versioned Flyway migrations, including clean-database startup and retained-development-database baseline tests.
- [ ] Build an idempotent one-click database provisioning command that creates the global Login/Central databases and one private database/user per gameServerId, emits per-server environment configuration, runs Flyway, and verifies required tables without storing production passwords in source.
- [ ] Migrate game-owned Redis keys and gameplay handlers from ambiguous userId usage to explicit playerId usage.
- [ ] Implement Gateway reconnect retention and duplicate-login conflict handling, including an explicit kick path and load accounting.
- [ ] Replace remaining development authentication shortcuts and insecure production defaults, including real token validation and externally supplied service/JWT secrets.
- [ ] Replace placeholder Game Server connection/player metrics with live values and cover registry notifications and reconnection behavior.

## Acceptance

- [ ] mvn test exercises the critical cross-service paths without manual log inspection.
- [ ] Account, player, session, Gateway, and Game Server identifiers have one documented meaning across contracts and storage keys.
- [ ] Disconnect, reconnect, duplicate login, service restart, and heartbeat timeout have deterministic tested outcomes.
- [ ] Production profiles contain no usable default secrets or bypass authentication paths.
