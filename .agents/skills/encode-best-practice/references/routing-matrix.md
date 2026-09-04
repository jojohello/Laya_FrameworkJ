# Routing Matrix

## Type Definitions

| Type | Question it answers | Example |
|---|---|---|
| Flow correction | What order must things happen in? | Lock art style before generating UI resources. |
| Tactical experience | What should I do instead of the obvious thing? | Do not cut existing atlases; regenerate individual sprites from a style reference. |
| Prompt template | How should I phrase this to get reliable output? | Generate in the style of this reference image; output individual small sprites, not a combined atlas. |

## Layer Definitions

| Layer | Enforcement | Override mechanism | Typical containers |
|---|---|---|---|
| Core | Hard stop or mandatory gate | Declared exception in nearest DESIGN.md with reason and impact, confirmed by user | Skill Gate section, DESIGN.md constraint |
| Default | Soft guidance, freely adjustable | No formal process; adjust or silence per project | Reference doc, workflow doc prompt section |

## Container Routing

The layer determines the container. The type determines the format within it.

### Core layer

| Type | Container | Format |
|---|---|---|
| Flow correction | Skill Gate section | Before [phase], [action] must be confirmed. Do not proceed to [next phase] without [evidence]. |
| Tactical experience | Skill Gate section | Do not [common approach]. Instead, [proven approach] because [reason]. |
| Prompt template | DESIGN.md constraint or skill Gate | When generating [artifact], use [proven phrasing]. Do not [common phrasing]. |

### Default layer

| Type | Container | Format |
|---|---|---|
| Flow correction | Reference doc workflow section | Recommended sequence: [steps]. Adjust as needed. |
| Tactical experience | Reference doc pitfalls section | Pitfall: [common approach] fails because [reason]. Better: [proven approach]. |
| Prompt template | Workflow doc prompt section | Full prompt text, marked as a starting template to iterate from. |

## Conflict Check

Before writing, search for:

- Existing skill Gate or DESIGN rules that say the opposite.
- Existing reference docs that cover the same topic with different guidance.
- Existing prompt templates that could be consolidated.

If a conflict exists, propose resolution: merge, replace, or split with a clear boundary. Do not write silently over existing rules.