---
name: laya-runtime-update-debugging
description: Use when a LayaAir battle entity has persistent animation, position jitter, missed attacks, stale state, or behavior that differs across AI scheduling, FSM update, movement/avoidance, and SkillAgent execution.
---

# Laya Runtime Update Debugging

## Overview

Trace one entity through the authoritative update chain and locate the first incorrect boundary. Treat animation and jitter as downstream symptoms.

**REQUIRED BACKGROUND:** Use `yq_superpowers:systematic-debugging` before proposing a fix.

## Workflow

1. Reproduce the issue consistently and select one stable `uid`.
2. Write the actual update order from code. For the current battle path, start with `BattleScene.logicUpdate`: AI scheduling runs before `BaseScene` entity/module updates. Distinguish render frames from logical ticks; one render frame may execute multiple logical ticks, so two state changes seen in one frame are not necessarily same-tick writes.
3. Add temporary logs only at boundaries that can change the decision:

| Boundary | Evidence |
| --- | --- |
| Scheduler -> AI | `tick`, `curTime`, UID, whether thinking ran |
| Behavior tree | target/skill IDs, coordinates, unrounded distance operands, range operands, comparison result, chosen branch |
| AI -> `runTo`/`attack` | command arguments, state before/after, return value |
| Run -> avoidance | `distance`, stop distance, remaining distance, desired vector |
| Avoidance -> movement | blocker UID, resolved vector, forward dot product, position before/after |
| `attack` -> SkillAgent | `canCast`, cooldown, active cast, accepted/rejected reason |
| Skill completion -> FSM | Action timing and state-transition source |

4. Correlate every line with `frame tick t uid target state`. Log one UID; add one low-frequency working control only when comparison is necessary.
5. Preserve numeric truth. Log the boolean result and enough precision to distinguish adjacent floating-point values. A formatted `65.000001` can hide `65.00000100000001 > 65.000001`. Flatten values at the log site instead of logging mutable objects that the console may expand after they change.
6. Find the first line where observed state diverges from the contract. Form one hypothesis and make one minimal test change.
7. After runtime confirmation, remove log calls, trace-only fields, maps, role tags, throttling state, and result summaries. Search stable debug prefixes before handoff.
8. Before handoff, apply root `AGENTS.md` documentation closure. Update README only when public runtime behavior or usage changed; update DESIGN when the confirmed cause establishes a stable update-order, ownership, tolerance, or lifecycle constraint; leave only unverified reproduction or acceptance in PlanAndStatus. Do not preserve the debugging diary.

## Decision Guide

- No AI line: inspect registration, scheduler group, resolver, and `nextThinkTime`.
- AI chooses movement although range operands look equal: inspect raw values and whether movement stops exactly on the comparison boundary.
- Desired movement closes distance but resolved movement does not: inspect avoidance output and forward dot product.
- AI chooses attack but SkillAgent rejects: inspect active cast, cooldown, config, Actions, and live target.
- SkillAgent accepts but Run resumes: inspect state ownership and update order.
- Attack and Run appear in one frame: compare logical ticks before treating the transition as a same-tick overwrite.

## Common Mistakes

- Logging every unit and losing the causal sequence.
- Formatting numbers before evaluating whether the comparison is wrong.
- Logging only inside one component instead of both sides of a boundary.
- Changing RVO weights, attack range, FSM state, and cooldown together.
- Leaving diagnostic state or debug prefixes in production after confirmation.
