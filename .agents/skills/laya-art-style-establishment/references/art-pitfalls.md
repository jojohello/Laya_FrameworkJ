# Art Workflow Pitfalls

Recurring problems and their proven corrections. Add new pitfalls here as they are encountered and validated, using the encode-best-practice skill to classify and route each one.

## 1. Cutting External Atlases

**Pitfall:** Taking an external sprite atlas (a combined image sheet) and trying to use AI or algorithms to cut it into individual sprites.

**Why it fails:** Current AI and algorithmic approaches cannot reliably detect sprite boundaries, handle transparent padding, or separate overlapping elements in a pre-composed atlas.

**Proven correction:** Do not cut. Instead, provide a reference image to the art generation tool and ask it to design new resources in that style, outputting individual small images. This bypasses the cutting problem entirely.

**Enforcement:** Core. This is a methodology-level correction, not a preference. See the Core Gate in SKILL.md.

## 2. Generating UI Without a Locked Style

**Pitfall:** Jumping straight into UI resource generation without first confirming the art style.

**Why it fails:** Without a locked style, each generation session may produce inconsistent results. Assets generated at different times will not match, leading to rework.

**Proven correction:** Run the style establishment protocol first. Generate the three canonical artifacts (loading screen, main interface, main character) and lock the style before any production UI work.

**Enforcement:** Core. See the Core Gate in SKILL.md.

## 3. Baking Text and Numbers into PNGs

**Pitfall:** Rendering labels, numbers, or other text directly into UI PNGs instead of using Laya text components.

**Why it fails:** Baked text cannot be localized, cannot update at runtime, and looks wrong at different resolutions.

**Proven correction:** Use Laya text components for all labels and numbers. Generate only graphical elements as PNGs.

**Enforcement:** Default. Already covered in laya-ui-art-builder and laya-ui-resource-workflow, included here for completeness.

## 4. Skipping Prompt Consistency Validation

**Pitfall:** Generating one design artifact, approving the style, then discovering inconsistency when generating the second or third artifact type.

**Why it fails:** A single artifact cannot prove the prompt produces consistent results across different content types (UI vs character vs full-screen).

**Proven correction:** Generate all three canonical artifacts before locking the style. Compare them for consistency. Iterate the prompt if they diverge.

**Enforcement:** Default. This is a recommended validation step, not a hard gate.