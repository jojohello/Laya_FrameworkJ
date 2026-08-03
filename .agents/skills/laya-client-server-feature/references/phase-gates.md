# Cross-End Delivery Gates

## 1. Authority gate

- Identify server-owned state and the client-visible projection.
- Identify `userId`, `playerId`, `sessionId`, and service ownership.
- List client intents; reject client-computed authoritative outcomes.
- Define invariants, transaction, authorization, idempotency, ordering, reconnect, and abuse cases.
- Stop if ownership is ambiguous.

## 2. Draft-contract gate

- Create the feature contract capsule.
- Define request, response, push/delta fields, constraints, targets, message bindings, and fixture mappings in `schema.json`.
- Define storage-to-wire transformations and semantic rules in DESIGN without duplicating the machine schema.
- Define exact integer, optional/null, version, duplicate, and gap semantics.
- Do not implement UI against an undocumented payload.

## 3. Server-domain gate

- Add schema through Flyway or the authoritative migration system.
- Keep Handler/controller transport-only.
- Implement services/repositories with ownership checks and atomic state changes.
- Test clean state, success, rejection, rollback, duplicate, overflow, and concurrency-sensitive paths.

## 4. Contract-lock gate

- Reconcile draft fields with proven server behavior.
- Inventory both new messages and new fragments added to existing responses or initialization sections.
- Allocate names and IDs in `Protocol/message-ids.yaml` and run the generator.
- Bind every new message or response fragment to a generated payload type.
- Replace handwritten wire DTOs with generated Java records and TypeScript types/guards; keep only domain-internal models handwritten.
- Serialize and parse canonical fixtures.
- Confirm Gateway scope and routing behavior.

## 5. Client gate

- Before client edits, identify whether new/moved/deleted Laya files require IDE-generated `.meta`; if so, pause at the metadata checkpoint and wait for explicit user confirmation.
- Apply generated structural guards at the Protocol/Manager boundary, then validate domain semantics.
- Apply snapshots/deltas through the feature Manager only.
- Reject stale duplicates; request a snapshot on version gaps.
- Make reconnect/auth completion trigger authoritative resynchronization.
- Drive UI from manager notifications; do not update authority locally for convenience.

## 6. Integration gate

- Run generator tests and drift checks.
- Confirm fixtures, message bindings, generated Java, generated TypeScript, and guards all derive from the same Schema.
- Run affected Maven tests and a clean compile where required.
- Confirm the JDK running tests is supported by bytecode instrumentation dependencies; use portable fakes when it is newer than their support window.
- Run TypeScript and client regression checks.
- Exercise request/response/push through Gateway.
- Exercise duplicate, reconnect, gap/resnapshot, and persisted relogin.
- Update stable docs and leave only genuinely unfinished acceptance in Plan.
