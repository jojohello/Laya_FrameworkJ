# Current Server Plan

## Objective

Establish a testable identity and connection lifecycle before adding more server-authoritative gameplay systems.

## Work Order

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
