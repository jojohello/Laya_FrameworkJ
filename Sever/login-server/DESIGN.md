# Login Server Design

## Responsibility

Login Server translates a platform credential into an account-level login result. It owns platform authentication adapters and login records; Central Data Server remains authoritative for shared user/session state and Gateway allocation.

## Boundaries

- `LoginController` adapts HTTP requests and responses.
- `LoginService` coordinates authentication, account resolution, token creation, and Central calls.
- `ThirdPartyAuthService` implementations isolate guest, test, WeChat, or future platform verification.
- `CentralDataService` and `CentralWebSocketClient` contain Central integration.

Do not place gameplay role creation or game-state loading in this service. The returned `userId` is an account identity, not a role identity.

## Security

- Production platform verification must call the real provider and reject test bypasses.
- JWT and service-auth secrets must be externally supplied and rotated independently.
- Never log raw platform codes, passwords, JWTs, or full session tokens.
- Login success is not Gateway authentication; Gateway independently validates the account, timestamp, and token with Central.
