---
name: encode-best-practice
description: "Encode a proven method, workflow insight, or effective prompt (记录更优实践, 固化操作建议, 提示词经验, 这个做法更好帮我记录, 把这条经验写入项目) into the correct project container with the right enforcement level. Use when you have a this-works-better insight and need to decide where it lives, how hard it enforces, and in what format. Do not use for ordinary task implementation or code writing."
---

# Encode Best Practice

Turn a raw insight into a permanently placed, properly enforced project rule. The goal is routing: the insight lands in the right container at the right enforcement level, so future sessions automatically benefit without a separate advice layer.

## Workflow

1. Capture the insight. State it in one sentence: what to do, what it replaces, and why it works.
2. Classify the type. Read [references/routing-matrix.md](references/routing-matrix.md) and determine:
   - Flow correction: a sequencing rule. Do X before Y, or never skip X.
   - Tactical experience: a method substitution. Do not do X, do Y instead because Z.
   - Prompt template: a proven way to phrase a generation request or instruction.
3. Classify the layer. Determine enforcement level:
   - Core: methodology-level correction, safety, data integrity, or authority boundary. Overriding requires a declared exception in the nearest DESIGN.md with reason and impact, confirmed by the user.
   - Default: work habit, step preference, or prompt phrasing. Freely adjustable or replaceable per project without a formal exception.
4. Route by layer. The layer determines the container: Core goes to skill Gate section or DESIGN.md constraint. Default goes to reference doc or workflow doc prompt section. The type determines the format within that container, not the container itself.
5. Draft in the correct format. Use the format templates in the routing matrix reference.
6. Check conflicts. Search existing skills, DESIGN.md files, and reference docs for rules that contradict or overlap. Surface conflicts and propose resolution before writing.
7. Confirm before writing. Show the user the classified insight, target container, and drafted content. Write only after confirmation.

## What This Skill Does Not Do

- It is not a reactive advisor that monitors sessions for struggling users.
- It does not create standalone skills for every insight. Most insights route into existing skills or docs.
- It does not bypass project document rules. Follow AGENTS.md conventions for README, DESIGN, and PlanAndStatus updates.