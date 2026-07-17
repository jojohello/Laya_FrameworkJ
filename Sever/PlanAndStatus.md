# Current Server Plan

## Objective

Establish a testable identity and connection lifecycle before adding more server-authoritative gameplay systems.

## Work Order

- [ ] Build an idempotent one-click database provisioning command that creates the global Login/Central databases and one private database/user per `gameServerId`, emits per-server environment configuration, runs Flyway, and verifies required tables without storing production passwords in source.
- [ ] Move Login Server schema management from Hibernate `ddl-auto=update` to versioned migrations so Login and Game databases use the same deployable upgrade discipline.
- [ ] Remove Game Server repository `CREATE TABLE` fallbacks after Flyway migration coverage and clean-database startup tests prove that migrations are the sole schema authority.
- [ ] Add automated smoke coverage for login, three-factor Gateway authentication, Gateway-to-Game routing, heartbeat expiry, and graceful unregister.
- [ ] Reconcile Gateway-to-Central lifecycle endpoints and cover allocation confirmation and disconnect with contract tests; current runtime logs have exposed `405` confirmation and `404` disconnect responses.
- [ ] Define and persist the Account-to-Player model; add `playerId` to the authenticated game context while retaining `userId` for account and network routing.
- [ ] Migrate game-owned Redis keys and gameplay handlers from ambiguous `userId` usage to explicit `playerId` usage.
- [ ] Implement Gateway reconnect retention and duplicate-login conflict handling, including an explicit kick path and load accounting.
- [ ] Replace development authentication shortcuts and insecure production defaults, including real token validation, platform verification, and externally supplied service/JWT secrets.
- [ ] Replace placeholder Game Server connection/player metrics with live values and cover registry notifications and reconnection behavior.

## Acceptance

- [ ] `mvn test` exercises the critical cross-service paths without manual log inspection.
- [ ] Account, player, session, Gateway, and Game Server identifiers have one documented meaning across contracts and storage keys.
- [ ] Disconnect, reconnect, duplicate login, service restart, and heartbeat timeout have deterministic tested outcomes.
- [ ] Production profiles contain no usable default secrets or bypass authentication paths.
