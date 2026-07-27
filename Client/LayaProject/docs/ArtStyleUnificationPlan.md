# Art Style Unification Plan

## Goal

Create a unified, production-ready visual style for the game client, then regenerate and replace assets screen by screen.

The target is not only "same prompt", but a repeatable art direction:

- consistent color palette
- consistent saturation and contrast
- consistent outline thickness
- consistent icon material language
- consistent UI bevel/highlight logic
- consistent background depth and readability
- independent PNG assets for Laya usage

## Recommended Target Style

Use the current better assets only as a structural reference, not as the final color/saturation target:

- `assets/ui/battlescene/imgs/stage_node_*.png`
- `assets/ui/battlescene/imgs/stage_reward_chest.png`
- `assets/ui/battlescene/imgs/stage_route_flag.png`
- `assets/ui/common/imgs/btn-bg-yellow0.png`
- `assets/ui/mainscene/imgs/icon-world.png`
- `assets/ui/mainscene/imgs/icon-box.png`
- `assets/ui/mainscene/imgs/icon-cup.png`

Updated visual direction:

```text
Q-version western magic adventure mobile game, bright clean cute style with moderate detail, polished 2D hand-painted cartoon, rounded soft shapes, medium outlines, readable silhouettes, low-to-medium saturation, warm soft highlights, gentle cel shading, fresh pastel-leaning colors, cute and friendly mood, reusable UI surfaces, high readability at small size.
```

World background:

- western magic world
- magic academy, spellbook, runes, crystals, parchment, soft metal, leather, wood, arcane glow
- avoid sci-fi, modern tech, eastern fantasy, casino-like luxury UI

## Color System

### Primary Palette

Use this as the stable project palette. Prefer bright but not highly saturated colors.

| Role | Color Range | Usage |
| --- | --- | --- |
| Soft Gold / Honey | `#F5C96B`, `#F0B94A`, `#C9872D` | buttons, rewards, gentle frame highlights |
| Fresh Cyan | `#7ADDE3`, `#53C7D3`, `#2F9FAE` | magic glow, water, active states |
| Mint / Leaf Green | `#8BD978`, `#63C36B`, `#3F9B59` | maps, grass, nature UI accents |
| Soft Blue Shadow | `#6C8EAD`, `#456B8D`, `#294C68` | shadow color, cool depth |
| Cute Red / Coral | `#EF6A5B`, `#D94B47` | warning, boss, unread point |
| Cream Light | `#FFF4CC`, `#FFE9A6` | highlight, text backing, soft rim |
| Soft Outline | `#5B4637`, `#314B5F` | icon outline and UI border |

### Saturation Rules

- UI icons: medium saturation, cute and bright, clear but not shiny-heavy.
- Backgrounds: medium saturation, soft contrast, lower detail behind UI placement areas.
- Functional bars: clean and flat, with limited highlights.
- UI should be slightly more saturated and higher contrast than the background.
- Background and UI should share the same hue family, but UI gets stronger edges and cleaner highlights.
- Red should be reserved for danger, boss, notification, damage, and important warnings.
- Purple should be used sparingly for magic/rare rewards, not as a dominant UI theme.

### Value / Brightness Rules

- Main interactive UI should have a gentle light top and mild lower bevel, not heavy glossy gradients.
- Icon silhouettes must read on both bright and dark backgrounds.
- Background node placement areas should be 15-25% calmer than the surrounding scene.
- Avoid very dark backgrounds unless the screen is explicitly night/dungeon themed.

## Shape Language

### Icons

- Rounded cute forms.
- Medium soft outline, usually 3-6% of icon size.
- One simple top-left highlight.
- One gentle cool shadow side.
- Avoid tiny internal details that disappear below 96px.
- No baked numbers or text.
- Transparent PNG, with 8-16px logical padding after trimming.

### Buttons

- Rounded rectangle or capsule.
- Warm honey/orange default.
- Simple top highlight, mild lower bevel, thin soft outer stroke.
- Pressed state should darken and move highlight slightly downward.
- Disabled state should reduce saturation by 40-60%.

### Panels

- Light cream or soft blue inner plate + honey/gold or soft brown border is recommended.
- Use clean corners, simple bevels, and sparse cute details.
- Large center areas must stay simple so nine-slice scaling works.
- Avoid strong gradients, painted texture, or decorative patterns in the stretchable center/edge bands.
- Keep v1-level production richness in non-stretchable corners/caps where possible.
- Keep v2-level simplicity in stretchable center and edge bands.

## Reusable UI Planning

Before making screen-specific UI, produce or select reusable base components:

- common window panel
- common title plate
- primary button
- secondary button
- disabled button
- close button
- icon frame
- reward frame
- progress bar
- notification red point

Screen-specific assets should reuse these whenever possible. New decorations should be added as separate small overlays instead of baking too many unique details into the base component.

## Background And UI Layering

Background and UI must feel unified, but UI must stand above the ground/map.

Backgrounds:

- lower saturation than UI
- softer contrast
- fewer hard outlines
- calm areas behind interactive elements
- western magical detail mostly around edges, landmarks, and non-interactive zones

UI:

- cleaner silhouette
- medium outline
- slightly brighter highlights
- stronger value separation
- readable at small sizes
- same western magic material language as the background

### Maps / Backgrounds

- Hand-painted fantasy, readable large shapes.
- Clear path or gameplay focus area.
- UI placement zones must be visually calm.
- Avoid text or symbols baked into the background.
- Keep story detail in corners and edges, not under buttons or labels.

## Prompt Standard

Use this base prompt for all generated assets:

```text
Polished 2D mobile game asset, Q-version western magic adventure style, bright clean cute art direction with moderate detail, hand-painted cartoon illustration, rounded soft shapes, medium clean outlines, readable silhouettes, gentle top-left highlights, soft cel shading, low-to-medium saturation, fresh mint/cyan accents, soft honey-gold UI accents, warm cream highlights, western magic motifs such as small runes, crystals, parchment, soft metal, and arcane glow, high readability at small size, cute friendly mood, no text, no numbers, no logo, no watermark.
```

For independent transparent icons:

```text
Create a standalone centered icon on a perfectly flat solid #ff00ff chroma-key background for background removal. Keep the icon fully separated from the background with crisp edges and generous padding. Do not use #ff00ff inside the icon. No cast shadow, no text, no numbers, no logo, no watermark.
```

For UI panels/buttons:

```text
Create a polished mobile game UI component with rounded beveled shapes, warm gold/orange highlights, dark blue/brown outline, glossy top highlight, darker bottom bevel, clean transparent-background-friendly edges, no text, no numbers, no logo, no watermark.
```

Nine-slice panel/button prompt:

```text
Create a nine-slice-friendly mobile game UI component: stable rounded corners, uniform border thickness, clean flat or very subtle center fill, simple edge bands that can stretch horizontally and vertically, decorative details only in the four corners or fixed caps, no complex gradients across the center, no painted texture in stretchable areas, no text, no numbers, no logo, no watermark.
```

For maps:

```text
Create a vertical mobile game fantasy stage map background with a clear winding path, calm circular node placement areas, teal/emerald jungle or fantasy landscape, warm highlights, soft atmospheric depth, readable gameplay composition, no characters, no text, no UI buttons, no numbers, no logo, no watermark.
```

## Implementation Strategy

### Phase 0: Confirm Initial Style

Output:

- one contact sheet of existing assets
- one target style sheet with 8-12 sample assets
- one map/background sample
- one common UI sample group

Decision:

- choose the target style from samples
- lock palette and shape language
- decide whether current `assets/ui/battleScene` becomes the first style baseline

User cooperation needed:

- confirm preferred style direction
- mark 3-5 current assets as "keep this feeling"
- mark 3-5 current assets as "replace this first"

### Phase 1: Battle Stage Screen

Reason:

This is the active feature today and has a clear screen target.

Assets:

- stage map background
- normal node
- cleared node
- current node
- boss node
- reward chest
- route flag
- star reward icon
- lock icon
- claim button background
- battle/start button background
- top title plate

Rules:

- all icons independent PNG
- no baked stage numbers
- no baked Chinese text
- Laya renders labels and numbers
- no manual `.meta`

### Phase 2: Common UI Kit

Assets:

- primary button
- secondary button
- disabled button
- close button
- add button
- setting button
- red point
- title plate
- small panel
- large panel
- scroll bar
- progress bar

Goal:

Every future screen reuses these before requesting custom UI.

### Phase 3: Main Scene Icons

Assets:

- feature buttons
- world/map
- chest
- cup/ranking
- flag/task
- power/energy
- currency icons if needed

Goal:

Unify icon angle, outline thickness, material highlights, and color contrast.

### Phase 4: Startup/Login/Loading

Assets:

- login button
- input field
- loading bar
- logo/background if needed

Goal:

Bring startup UI up to the same polish level after core gameplay screens are stable.

### Phase 5: Map and Battle Backgrounds

Assets:

- existing map backgrounds
- floor/tile sheets
- battle scene decoration

Goal:

Unify world art direction while keeping functional map data compatible.

## Replacement Rules

- Do not overwrite existing assets during review.
- Use a new folder or `*_v2.png` first.
- After approval, update UI references or rename assets intentionally.
- Do not generate `.meta` manually.
- Keep source/contact sheets only if useful for review; final Laya assets should be independent PNGs.

## Daily Workflow

1. Pick one screen or UI kit.
2. List required assets and target sizes.
3. Generate a small style sheet first.
4. Review style, readability, and color.
5. Split into independent PNGs.
6. Put files in the expected asset folder.
7. Integrate in Laya UI/code.
8. Review in actual screen.
9. Iterate only the mismatched assets.
10. Promote approved assets into the common style baseline.

## Today's Recommended Work

Today should focus on Phase 0 and Phase 1:

1. Confirm `assets/ui/battleScene` as the first target style baseline, or generate 1-2 alternate battle style sheets.
2. Complete the battle stage screen art set.
3. Build the Laya pass screen using independent PNGs.
4. Review the actual screen instead of judging assets in isolation.
