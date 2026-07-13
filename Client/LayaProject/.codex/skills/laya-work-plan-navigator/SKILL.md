---
name: laya-work-plan-navigator
description: Navigate and maintain this project's scoped README.md, DESIGN.md, and PlanAndStatus.md system. Use when deciding what to read for a task, evaluating next development work, recording a current plan, promoting completed outcomes into durable documentation, deleting completed plans, or checking documentation scope and conflicts.
---

# Laya Work Plan Navigator

Use repository documents as the source of truth. Do not keep a second project plan inside this skill.

## Read

1. Read root `AGENTS.md` for the document access protocol.
2. Determine the smallest directory scope affected by the request.
3. Read every existing `DESIGN.md` from the repository root down to that scope, in order.
4. Read the nearest relevant `README.md` files for public behavior and usage.
5. Read `PlanAndStatus.md` only when unfinished work, priority, blockers, or handoff matter.
6. Verify claims against code and configuration before treating them as current facts.

## Decide

- Prefer the nearest scoped rule when it supplements an outer rule.
- If an inner document contradicts an outer DESIGN without an approved exception declaration, surface the conflict before implementation.
- Missing documents are meaningful and valid. Never create one solely to complete a set.
- Evaluate next work by dependency and validation value. A real lifecycle entry usually precedes features that require that lifecycle for trustworthy testing.

## Write

- Put current public capabilities and usage in the nearest `README.md`.
- Put stable architecture, constraints, tradeoffs, and repeated-error prevention in the nearest effective `DESIGN.md`.
- Put only unfinished tasks, blockers, order, and acceptance conditions in `PlanAndStatus.md`.
- Do not add dated progress logs or completed checklists to Plan files.
- Add a rule only after a real need, repeated error, or confirmed decision. Remove stale rules.

## Complete A Plan

1. Identify information that remains useful after the work is done.
2. Promote public outcomes to README and stable decisions or lessons to DESIGN.
3. Confirm the Plan contains no unique unfinished work or unresolved blocker.
4. Delete completed items. Delete the Plan file when nothing unfinished remains.
5. Run `powershell -ExecutionPolicy Bypass -File tools/docs/validate-doc-system.ps1`.
