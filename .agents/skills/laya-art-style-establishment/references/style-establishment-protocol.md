# Style Establishment Protocol

## Prerequisites

- The development environment Gate from bootstrap-laya-game has passed.
- The user has a game direction (exploration or initiation) confirmed.
- No existing style lock in docs/ArtStyleDecisionLog.md.

## Step 1: Gather Style Inputs

Ask the user for:

- One or more reference images that represent the desired visual direction.
- A natural-language description of the desired style: mood, color palette, line quality, shading approach, and any constraints.
- Platform and audience considerations that affect art density and readability.

If the user has no reference image, the default project style prompt in laya-ui-art-builder can serve as a starting point, but the user should still confirm or adjust it.

## Step 2: Identify the Generation Tool

Determine which art generation capability is available in the current environment. Use $imagegen or the equivalent art generation skill. Confirm it can:

- Accept a reference image as style input.
- Output individual images, not a combined atlas.

## Step 3: Generate Three Canonical Artifacts

Generate in this order. Each artifact validates the style from a different angle.

### 3a. Loading Screen Design

- Full-screen composition.
- Tests: overall mood, color palette, typography style, logo treatment.

### 3b. Main Interface Design

- UI layout mockup showing panels, buttons, and HUD elements.
- Tests: readability, UI clarity over background, component style consistency.

### 3c. Main Character Design (3 options)

- Generate 3 character design variants.
- Tests: character proportions, shading style, accessory and prop style, silhouette clarity.
- The user picks one or requests adjustments; this confirms the character art direction.

## Step 4: Validate Prompt Consistency

Compare the three artifacts:

- Do they share a consistent color palette and line quality?
- Do the UI elements and character art look like they belong to the same game?
- Are the lighting and shading approaches consistent?

If not, the generation prompt needs iteration before production. Adjust the prompt and regenerate until consistency is achieved across all three artifact types.

## Step 5: Confirm and Lock

Present all three artifacts to the user. On explicit confirmation:

1. Write the locked style to docs/ArtResourceGuide.md:
   - Style description: the refined prompt that produced consistent results.
   - Color palette, line quality, shading approach.
   - Constraints: no baked text, no baked numbers, etc.
   - Reference images used (paths or descriptions).

2. Write the decision to docs/ArtStyleDecisionLog.md:
   - Date of confirmation.
   - What was generated and what the user approved.
   - The final prompt that produced consistent output.
   - Any adjustments the user requested.

3. Remove temporary review and comparison images from the project.

## Step 6: Hand Off

After style lock, production work proceeds under laya-ui-resource-workflow and laya-ui-art-builder. Those skills read docs/ArtResourceGuide.md as the style source of truth.

## Prompt Template

This is a default starting template. Iterate and adjust per project.

```
Design a [artifact type] for a [game genre] game. Reference style: [reference image or description]. Output as individual image files, not a combined atlas. Mood: [mood]. Color palette: [colors]. Line quality: [description]. Shading: [description]. No baked text, no baked numbers, no watermark.
```