---
name: laya-art-style-establishment
description: "Lock the art style for a LayaAir game before UI resource production. Use when starting art or UI work and no style is confirmed, or when the user wants to establish or revise the visual direction. Do not use when the style is already locked and production work is underway."
---

# Laya Art Style Establishment

Establish and lock the game art style before generating production UI resources. This is the gate that prevents the most common art workflow failure: jumping into UI production without a confirmed style, then struggling to cut or adapt mismatched assets.

## Core Gate

These rules are methodology-level corrections. Overriding requires a declared exception in the nearest DESIGN.md with reason and impact, confirmed by the user.

### 1. Lock style before production

Before generating any production UI resource, confirm the art style is locked. A style is locked when docs/ArtStyleDecisionLog.md exists and records a user-confirmed style decision, and docs/ArtResourceGuide.md contains the current style description and constraints.

If neither exists, the style is not locked. Run the establishment protocol below.

### 2. Do not cut existing atlases

Do not attempt to slice or auto-cut external sprite atlases into individual sprites. Current AI and algorithmic approaches cannot reliably do this. Instead:

- Provide a reference image to the art generation tool.
- Ask it to design new resources in that reference style.
- Require output as individual small images, not a combined atlas.

This bypasses the cutting problem entirely by never creating a combined atlas that needs cutting.

## Establishment Protocol

Read [references/style-establishment-protocol.md](references/style-establishment-protocol.md) before running the protocol.

Summary:

1. Gather reference images and natural-language style direction from the user.
2. Identify the art generation skill available in this environment (for example $imagegen).
3. Generate three canonical design artifacts:
   - Loading screen design
   - Main interface design
   - Main character design (generate 3 options)
4. These artifacts serve double duty: they confirm the visual style AND validate that the generation prompt produces consistent results.
5. If output is inconsistent across the three artifacts, iterate the prompt before proceeding.
6. On user confirmation of the style, write the locked style description to docs/ArtResourceGuide.md and the decision record to docs/ArtStyleDecisionLog.md.
7. Hand off to laya-ui-resource-workflow or laya-ui-art-builder for production.

## Pitfalls

Read [references/art-pitfalls.md](references/art-pitfalls.md) when encountering art workflow problems. This file collects recurring pitfalls and their proven corrections.

## Handoff

After style lock, production work uses:

- laya-ui-resource-workflow for UI resource creation and validation.
- laya-ui-art-builder for PNG generation, .ls/.lh editing, and asset management.