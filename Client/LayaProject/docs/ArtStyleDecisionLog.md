# Art Style Decision Log

## 2026-07-07: Style Direction Adjustment

User feedback:

- Current style is still not fully satisfying.
- Avoid high saturation.
- Prefer bright colors, clean composition, and cute feeling.
- UI background/panel assets must consider nine-slice usage.
- Avoid complex gradients that cannot extend cleanly with nine-slice scaling.

## 2026-07-07: V4 Nine-Slice Style Trial

Generated review image:

- v4 nine-slice trial image was reviewed and then removed from the project after the style was locked.

User decision:

- Accepted. Lock v4 as the current project UI art style baseline.

Judgment:

- v4 is the locked production direction for common UI components.
- It keeps v3's western magic feeling, crystals, leaves, honey-gold trim, and polished cartoon rendering.
- It is cleaner than v3 in the large panel center and title-bar center, so it is closer to nine-slice usage.
- It still uses slightly heavy gold borders and some glossy gradients. Final production should reduce saturation/gloss by another small step.

Production interpretation:

- Use v4 as the style reference for common UI kit generation.
- Do not use the v4 sheet directly as final assets.
- Generate or edit final assets as independent PNGs.
- For panels/buttons, split base nine-slice assets from fixed decorations.
- Keep the large panel center flatter than v4 if it will be scaled often.
- Keep title bars simple in the stretchable middle; put crest/gem details in fixed overlays.

V4 next prompt target:

```text
Bright clean cute Q-version western magic mobile game UI, v4 direction. Keep the western magic crystals, leaves, parchment, soft metal, honey-gold trim, and arcane cyan accents, but reduce gold saturation and glossy contrast slightly. Make all nine-slice centers flatter and cleaner than the style sheet. Decorative detail belongs only in corners, fixed caps, and separate crest overlays. No baked text, numbers, logos, or watermark.
```

## Updated Target Direction

```text
Bright clean cute Q-version fantasy mobile game UI.
Low-to-medium saturation.
Rounded soft shapes.
Medium-light outlines.
Simple highlights.
Soft cel shading.
Warm cream, soft honey yellow, pale orange, fresh cyan, mint green, soft blue shadows.
Minimal ornamentation.
No heavy glossy RPG premium look.
No complex gradients in stretchable panel/button areas.
```

## Trial Images

| Version | Asset Status | Judgment |
| --- | --- | --- |
| v1 | deleted trial | Better than previous high-saturation RPG style, but still too ornate, gold-heavy, glossy, and premium-looking. |
| v2 | deleted trial | Closer to target: softer, brighter, simpler, cuter, lower saturation, more nine-slice friendly. Needs flatter title-bar center in production. |
| v3 | deleted trial | Strong world/style direction: western magic, cute, moderate detail, better production value. Risky for nine-slice if produced as one baked panel. |
| v4 | deleted trial, style locked | Accepted production direction for common UI: v3's magic richness with cleaner v2-like structure. Final assets reduce gold weight/gloss and flatten stretchable centers. |

## Current Recommendation

Use v4 as the locked visual style. Keep v3's moderate detail and western magic richness, keep v2's clean structure and nine-slice discipline, and avoid returning to v1's heavy glossy RPG look.

When generating final production assets:

1. Replace the final integration filename directly after approval.
2. Delete trial, review, source, contact-sheet, and comparison PNGs.
3. Keep the style memory in this text document and `docs/ArtAssetReplacementMap.md`, not as extra image files.

## 2026-07-27: Page Surface And Settlement Rule

User decision:

- Reference scenes establish the bright, clean western-magic world direction; result pages must feel like compact UI over that world, not separate dark Loading posters.
- Full-screen art is reserved for Loading, login, map, or another page whose own scene is the content.
- Functional pages, dialogs, settlement pages, and information panels default to host scene + translucent input mask + local panel.
- Use plain or low-detail surfaces when they satisfy the role. Prefer verified nine-slice title bars, panels, and buttons over decorative full-screen art.

## V3 Production Interpretation

V3 should not be copied directly as one-piece UI textures.

Instead, produce final reusable UI as layered assets:

- base nine-slice window panel: simple cream/parchment center, stable border, no top crest baked into the stretch area
- separate corner decorations: crystals, leaves, small rune plates
- separate top crest/title ornament: fixed overlay, not part of the nine-slice panel
- base title bar: simple stretchable blue center and stable end caps
- separate title-bar caps/decorations if needed
- primary/secondary/disabled buttons: nine-slice-safe center and edge bands, small sparkles only as optional overlay

This keeps v3's production richness while preserving Laya scalability.

## World Background

The story background is a western magic world.

Implications:

- UI motifs should lean toward magic academy, spellbook, runes, crystals, soft metal, parchment, leather, wood, and gentle arcane glow.
- Avoid modern tech, sci-fi, eastern fantasy, or generic casino-like UI language.
- Cute feeling is allowed, but it should still feel like a western magical adventure.
- Decorations should prefer stars, moons, small crystals, soft runes, leaves, scroll corners, magic seals, and simple gem accents.

## Nine-Slice Production Rule

Panels and buttons must be generated or edited with these constraints:

- flat or near-flat center fill
- uniform border thickness
- stable corner shapes
- stretchable horizontal/vertical edge bands
- decorations only in corners or fixed caps
- no large gradients crossing the center
- no texture or pattern in stretchable center/edge areas
- no baked text or numbers

## UI vs Background Layering Rule

UI and backgrounds should share the same world style, but they should not have the same visual weight.

Backgrounds:

- softer saturation
- lower contrast
- fewer sharp outlines
- more atmospheric depth
- calmer areas behind UI and text
- western magical environment details can exist near edges and corners

UI:

- slightly higher contrast than the background
- cleaner silhouette
- clearer border
- brighter highlight
- more stable shape language
- readable at small size
- should feel like it belongs to the same western magic world, not pasted on top

Recommended hierarchy:

```text
Background saturation: low to medium
Background contrast: soft
UI saturation: medium
UI contrast: medium-high
Reward/important UI: highest contrast, but still not neon/high-saturation
```

## 2026-07-07: Main Scene UI Separation Decision

Context:

- The accepted main scene composition uses a bright castle/town background.
- The original bottom dock and feature button palette was too close to the background's cream stone and warm roof colors.
- The user accepted the adjusted result and asked to keep this decision for future screens.

Locked practical decision:

- Keep the world unified, but give UI a clearer value and edge separation from the scene.
- Bottom dock/panel centers should shift slightly away from the dominant scene color.
- Over bright castle or grass scenes, pale cyan-cream works better than pure cream/parchment for large bottom UI supports.
- Main feature buttons may keep warm gold/orange because they are part of the style, but they need stronger outer edge definition and soft dark grounding/shadow.
- Interaction support panels can be more opaque when needed. In `MainSceneView.ls`, `bottom_bg` alpha `0.9` read better than `0.7`.

Accepted reference assets:

- `assets/ui/mainscene/imgs/bottom-panel.png`
- `assets/ui/mainscene/imgs/btn-bg-yellow.png`
- `assets/map/map001/map001.png`

Future prompt add-on:

```text
Ensure clear separation from a bright pastel fantasy background: slightly stronger border, soft dark grounding/shadow, and a panel center hue that does not merge with castle stone, grass, or sky.
```

## 2026-07-16: Main Scene Top HUD Decision

The complete top-HUD concept was approved before production slicing. The locked composition is:

- a compact medium-dark desaturated teal-blue leather support instead of a pale parchment information panel or a near-black bar
- a circular avatar overlapping the left edge as the main visual anchor
- a small attached level badge, player name, and a thin green EXP bar
- compact currency and stamina groups continuing on the same strip
- restrained honey-gold outlines with cyan reserved for magic and add actions

Production rules learned from the rejected assembly:

- design and approve the complete silhouette and information density before cutting independent assets
- do not let one generic panel background determine the whole composition
- keep fixed end caps and decorations in the strip image, while keeping icons, values, avatar, badge, and progress fill independent
- export close to the intended runtime display size; do not retain oversized source pixels in formal UI assets
- render all player names, levels, balances, stamina, and progress values through Laya text/data binding
- the top HUD is screen UI, not scene-space HUD; scene-object health bars must not be used as its layout reference
- design and review it on the full `750x1335` canvas; the finalized logical bounds are approximately `560x88`, about 75% of screen width and 6.6% of screen height
- keep raster dimensions close to runtime size: the support strip is `520x54`, the common portrait frame is `88x88`, the level badge is `36x36`, and the common add icon is `28x28`
- share one teal-blue center, soft honey-gold border, cyan accent, border weight, and highlight direction across the strip, portrait frame, level badge, and add icon

## Reuse Planning Rule

Before producing final screen-specific UI, define reusable assets first:

- common window panel
- common title plate
- primary button
- secondary button
- disabled button
- close button
- small icon frame
- reward frame
- progress bar
- red point / notification marker

Screen-specific assets should only be created after checking whether a common asset can be reused.

For western magic world UI, common reusable assets should be motif-neutral enough to work across:

- battle stage map
- reward popup
- shop
- character/hero panel
- settings
- event screens

Avoid over-specializing common panels with battle-only decoration.
