# Server AI Guide

Follow the repository-root `AGENTS.md` document protocol.

## Task Loading

For cross-service work, read `DESIGN.md`, `README.md`, and the current root `PlanAndStatus.md` when it exists. For service-local work, then read that service's `DESIGN.md` and `README.md`; read a local Plan only if one exists.

The active Maven modules are `common`, `login-server`, `gateway-server`, `central-data-server`, and `game-server`. `database-server` is a placeholder and is not part of the parent Maven reactor.

Treat source and runtime configuration as authoritative when documentation disagrees. Keep cross-service contracts in `Sever/DESIGN.md` and service internals in the nearest service `DESIGN.md`.

## Development Baseline

- Java 25 and Maven multi-module build.
- Spring Boot 3.2.0.
- Project-maintained text is UTF-8 without BOM with LF line endings.
- Do not edit `target`, `output`, or log artifacts as source.
- Add tests proportionate to changes; cross-service contracts require integration or smoke coverage.

## Verification

Run from `Sever`:

```powershell
mvn test
powershell -ExecutionPolicy Bypass -File tools/docs/validate-doc-system.ps1
```
