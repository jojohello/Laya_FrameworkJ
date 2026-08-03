# Cross-End Feature Contract Template

Use this template for `Protocol/contracts/<feature>/DESIGN.md`. Remove irrelevant sections rather than keeping placeholders.

## Scope and outcome

- User-visible outcome
- In-scope systems
- Explicit non-goals

## Authority and identity

| State or decision | Authority | Client role | Identity key |
| --- | --- | --- | --- |

State trusted and untrusted inputs. Resolve gameplay ownership from authenticated `playerId` on the server.

## Invariants and state machine

- Preconditions
- Atomic changes
- Idempotency key and duplicate result
- Ordering rule
- Reconnect/recovery rule

## Messages

For each request, response, and push, define sender, receiver, trigger, success, and error semantics. Put message names, fragment paths, payload types, fields, and mechanical constraints in `schema.json`; do not duplicate them here.

## Storage and semantic transformations

| Domain/storage value | Generated wire type | Transformation or semantic rule |
| --- | --- | --- |

## Errors

Use stable machine-readable codes. Define retryability and whether state may have changed.

## Versioning and compatibility

Define snapshot version, delta base/result versions, gap handling, duplicate handling, rollout order, and compatibility window.

## Fixtures

List canonical JSON files under `fixtures/`. Map each file to its generated type in `schema.json`, then identify producer/consumer tests that parse it.

## Acceptance

List server tests, client checks, generator checks, Gateway/E2E checks, reconnect checks, and any IDE/device-only evidence.
