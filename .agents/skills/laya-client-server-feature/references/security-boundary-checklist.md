# Server-Authority Security Checklist

## Client may provide

- Intent: command, selected configured entity/item, bounded quantity, target, and request correlation ID.
- Presentation-only preferences that do not affect authoritative outcomes.
- Locally observed context only when the server independently validates it.

## Client must not decide

- Rewards, balances, inventory counts, experience, progression, victory, cooldown completion, prices, ownership, permissions, server time, random outcomes, or final damage.
- `playerId` ownership for a gameplay mutation.
- Snapshot/delta version or idempotency completion state.

## Server must enforce

- Authenticated session and selected player ownership.
- Configuration existence and allowed operation.
- Capacity, balance, count, cooldown, and state-transition invariants.
- Checked arithmetic, rollback, idempotency, ordering, and durable version updates.
- Stable error codes without secrets or internal stack details.

## Client reconciliation

- Treat responses and pushes as authoritative only after structural validation.
- Ignore stale duplicate versions.
- Stop applying deltas when `baseVersion` differs from local version.
- Request a full snapshot after a gap, reset, reconnect, or uncertain outcome.
- Never hide an authority mismatch with a local compensating mutation.
