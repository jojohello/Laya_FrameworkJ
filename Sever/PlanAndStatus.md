# Current Server Plan

## Objective

Establish a testable identity and connection lifecycle before adding more server-authoritative gameplay systems.

## Work Order

- [ ] Move Login Server schema management from Hibernate ddl-auto=update to versioned Flyway migrations, including clean-database startup and retained-development-database baseline tests.
- [ ] Build an idempotent one-click database provisioning command that creates the global Login/Central databases and one private database/user per gameServerId, emits per-server environment configuration, runs Flyway, and verifies required tables without storing production passwords in source.
- [ ] Migrate game-owned Redis keys and gameplay handlers from ambiguous userId usage to explicit playerId usage.
- [ ] Implement Gateway reconnect retention and duplicate-login conflict handling, including an explicit kick path and load accounting.
- [ ] Replace remaining development authentication shortcuts and insecure production defaults, including real token validation and externally supplied service/JWT secrets.
- [ ] Replace placeholder Game Server connection/player metrics with live values and cover registry notifications and reconnection behavior.
- [ ] Add dedicated coverage for heartbeat-timeout expiry and graceful Gateway unregister, which the current smoke test does not yet exercise.

## Acceptance

- [ ] A process-level smoke test exercises login, three-factor Gateway auth, heartbeat, Gateway-to-Game routing, connection confirmation and disconnect through real HTTP/WebSocket boundaries. Heartbeat-timeout expiry and graceful unregister still need dedicated coverage.
- [ ] Account, player, session, Gateway, and Game Server identifiers have one documented meaning across contracts and storage keys.
- [ ] Disconnect, reconnect, duplicate login, service restart, and heartbeat timeout have deterministic tested outcomes.
- [ ] Production profiles contain no usable default secrets or bypass authentication paths.
