---
name: laya-client-server-feature
description: Design, implement, and verify a Laya game feature that crosses Client, Protocol, Gateway, or Sever boundaries. Use for server-authoritative state, request/response or push messages, login/reconnect synchronization, rewards, inventory, wallet, battle settlement, identity, exact integers, payload Schema changes, or any change where client and server must ship one compatible contract. Enforce ownership, security, staged gates, generated message IDs and payloads, runtime boundary validation, and end-to-end evidence; do not use for a purely local UI, art, or service-internal refactor with no cross-end contract.
---

# Laya Client Server Feature

Treat the feature as one delivery unit even when work starts inside `Client`, `Sever`, or `Protocol`. Keep the current working directory; resolve the repository root with `git rev-parse --show-toplevel` and use root-relative paths.

## Load only relevant context

1. Read root `AGENTS.md`, `DESIGN.md`, and `README.md`.
2. Read `Protocol/DESIGN.md` and `Protocol/README.md`.
3. Locate `Protocol/contracts/<feature>/schema.json` and `DESIGN.md`; create them only for a confirmed cross-end feature and use `references/feature-contract-template.md` for the semantic document.
4. Read target client and server `DESIGN.md`/`README.md` files only when entering their implementation phase.
5. Read `PlanAndStatus.md` only for unfinished work or handoff. Do not scan unrelated modules.

## Run the delivery gates

Read `references/phase-gates.md` and follow every gate in order. A later gate may start only when the earlier gate has repository evidence.

1. Define state authority, identities, trusted inputs, invariants, transaction, idempotency, ordering, reconnect, and security failures.
2. Define generated request, response, push/delta fields and bindings in `schema.json`; define authority, errors, versions, compatibility, and canonical fixtures before production code.
3. Implement and test server services, persistence, authorization, transactions, and idempotency without trusting client-computed results.
4. Allocate IDs only in `Protocol/message-ids.yaml`, bind messages/fragments in `schema.json`, run the generator, consume generated payloads/guards, and lock fixtures to final serialization. Treat new fields on an existing response as contract changes too.
5. Implement client protocol validation and reconciliation, then manager state, then UI. UI must not mutate authority or construct transport messages.
6. Verify client checks, Maven tests, generator drift, fixtures, Gateway routing, reconnect/resnapshot behavior, and documentation.

When server feasibility changes a draft field, update the Schema and semantic contract before client work. Never handwrite a second client or server wire DTO.

## Enforce ownership

Read `references/security-boundary-checklist.md` for player state, rewards, currency, inventory, battle results, progression, authentication, or authorization.

- Let the client send intent and presentation preferences.
- Let the server decide results, validate ownership, mutate and persist state, assign versions, and return errors.
- Resolve `playerId` from authenticated server context; never trust client-supplied ownership.
- Keep Gateway on authentication and routing unless YAML scope is explicitly `gateway`.
- Keep Config as static definitions, never runtime player state.

## Keep one contract capsule

Use `Protocol/contracts/<feature>/`:

- `DESIGN.md`: stable authority, state machine, messages, fields, errors, versioning, compatibility, and acceptance.
- `schema.json`: sole machine-readable source for wire fields, constraints, generated targets, message bindings, and fixture mappings.
- `fixtures/*.json`: canonical wire examples parsed by both ends.
- `PlanAndStatus.md`: unfinished gates, blockers, and acceptance only; delete when empty.

Update closest client/server docs for local internals. Do not duplicate the full cross-end contract into both sides.

## Preserve generated-source integrity

- Edit `Protocol/message-ids.yaml`, never generated `MessageIds` files.
- Edit payload fields only in `Protocol/contracts/<feature>/schema.json`, never generated Java records, TypeScript interfaces, or guards.
- Run `npm.cmd run generate` from `Protocol/tools` and include every tracked output.
- Run `npm.cmd test`; its check mode must fail on Schema, fixture, binding, or generated-file drift.
- Apply generated structural guards at untrusted client boundaries, then apply Manager/domain semantic validation. Schema validation does not replace authorization, transaction, idempotency, or version-continuity checks.
- Remove misleading legacy message sources when runtime usage proves they are obsolete.
- Send exact 64-bit values as decimal strings unless a documented bound proves JavaScript `number` safe.

## Stop for Laya metadata when required

- Never create, copy, or guess a Laya `.meta` UUID.
- When adding, renaming, moving, or deleting a Client asset or source module that requires `.meta` synchronization, finish only the safe pre-IDE portion first.
- Tell the user exactly which paths need LayaAir IDE import, ask them to activate/open the IDE so it generates or updates metadata, and stop the turn.
- Continue the remaining edits and validation only after the user explicitly confirms that IDE metadata generation has finished. Re-read the generated `.meta` files before proceeding.
- Do not treat a filesystem watcher creating `.meta` during the turn as user confirmation.

## Keep verification portable

- Distinguish the Java bytecode target from the JDK running Maven and tests.
- Prefer small fakes or pure domain tests when runtime instrumentation libraries do not support the active JDK.
- Compare canonical fixtures against actual serialized JSON; do not rely on in-memory numeric node classes when wire text is the contract.
- Record live Gateway, IDE, or device checks separately from deterministic automated checks.

## Finish with evidence

Report authority decisions, server tests, protocol generation, client checks, integration checks, and IDE/device-only acceptance separately. If integration cannot run, keep the feature incomplete in the nearest Plan without a progress diary.

Before handoff, apply the root `AGENTS.md` documentation closure: update the nearest README for changed public behavior, the nearest effective DESIGN for changed stable contracts or constraints, and PlanAndStatus only for genuinely unfinished gates or blockers. Remove completed Plan items and delete an empty Plan. Do not duplicate the cross-end contract into client and server docs.

