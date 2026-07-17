# Art Production Workflow

## Purpose

This document defines the art production workflow for the project.

The goal is to make asset generation repeatable:

- same style direction
- clear asset purpose
- clear target size
- clear output folder
- clear Laya usage mode
- independent PNG files when referenced by Laya
- no manually generated `.meta` files

## Core Principle

Do not start from a vague prompt.

Every generated asset should come from structured information:

1. Project style profile
2. Screen art brief
3. Asset list table
4. Single asset card
5. Review checklist

If the table is complete enough, the asset can be generated without extra questions.

## 1. Project Style Profile

This is the global style lock. It changes rarely.

| Field | Current Value |
| --- | --- |
| Game genre | Q-version western magic adventure RPG |
| World background | western magic world |
| Render style | bright clean cute 2D hand-painted cartoon with moderate detail |
| Icon style | rounded, cute, medium outline, simple highlight |
| Background style | bright fantasy scene, readable gameplay zones, soft contrast |
| Main UI colors | soft honey-gold, fresh cyan, mint green, soft blue shadow |
| Motifs | runes, crystals, parchment, soft metal, leather, wood, arcane glow |
| Warning color | red |
| Rare/magic color | purple, used sparingly |
| Saturation | low-to-medium, bright but not highly saturated |
| Contrast | clear for interactable UI, soft behind text/UI placement |
| Text in image | avoid; use Laya text |
| Numbers in image | avoid; use Laya text |
| Output mode | independent PNG for Laya-referenced icons |
| Meta files | let Laya generate automatically |
| Current UI reference | v4 locked text style; trial/contact images are not kept in the project |
| Production rule | v4 locked style, but flatter stretchable centers and slightly lighter gold/gloss |

Base prompt:

```text
Polished 2D mobile game asset, Q-version western magic adventure style, bright clean cute art direction with moderate detail, hand-painted cartoon illustration, rounded soft shapes, medium clean outlines, readable silhouettes, gentle top-left highlights, soft cel shading, low-to-medium saturation, fresh mint/cyan accents, soft honey-gold UI accents, warm cream highlights, western magic motifs such as small runes, crystals, parchment, soft metal, leather, wood, and arcane glow, high readability at small size, cute friendly mood, no text, no numbers, no logo, no watermark.
```

Common UI v4 add-on:

```text
Use the v4 nine-slice direction: western magic crystals, leaves, parchment, soft metal, honey-gold trim, and arcane cyan accents, but keep centers flat or near-flat, reduce gold saturation and glossy contrast slightly, place decoration only in corners, fixed caps, or separate overlays, and avoid any complex gradient or texture in stretchable center/edge areas.
```

UI over bright scene add-on:

```text
Ensure clear separation from a bright pastel fantasy background: slightly stronger border, soft dark grounding/shadow, and a panel center hue that does not merge with castle stone, grass, or sky.
```

### UI And Background Layering

The accepted main scene result locks this practical rule:

- backgrounds stay bright, low-to-medium saturation, and soft contrast
- UI belongs to the same world style but has clearer borders, stronger silhouette, and slightly higher contrast
- bottom dock/panel centers should avoid matching castle-wall cream or ground colors too closely
- pale cyan-cream worked well for the main scene bottom dock over a bright castle background
- warm gold/orange buttons are acceptable, but need a stronger outer edge and soft dark grounding
- high-opacity interaction panels can be better than overly transparent panels; `0.9` worked better than `0.7` for the main scene bottom dock

## 2. Screen Art Brief

Use this before producing assets for one screen.

| Field | Description | Example |
| --- | --- | --- |
| Screen ID | Stable screen/module name | `battle_stage_map` |
| Screen purpose | What the player does here | Select or enter a battle stage |
| Target platform | Web / WeChat / Douyin | WeChat mini game |
| Orientation | portrait / landscape | portrait |
| Base resolution | Design resolution | `750x1400` |
| Main mood | Emotional direction | adventurous, bright, magical |
| Main visual focus | What should draw attention | current battle node |
| UI density | low / medium / high | medium |
| Text rendering | image / Laya text | Laya text |
| Existing references | Existing assets or screenshots | reference screenshot, `assets/ui/battleScene/*` |
| Output folders | Where files should go | map to `assets/bigImg`, icons to `assets/ui/battleScene` |

## 3. Asset List Table

This is the most important table. If filled, generation can proceed.

| Field | Required | Description |
| --- | --- | --- |
| Asset ID | yes | Stable lowercase name |
| Asset type | yes | background / icon / button / panel / effect / bar |
| Purpose | yes | What it does in UI |
| State | optional | normal / selected / disabled / cleared / locked |
| Target size | yes | Pixel size or approximate size |
| Final format | yes | PNG / JPG / WebP |
| Transparency | yes | yes / no |
| Output path | yes | Project path |
| Laya usage | yes | independent image / background / 9-slice / tiled / animation |
| Text baked in | yes | should normally be no |
| Number baked in | yes | should normally be no |
| Style notes | optional | Specific style variation |
| Avoid | optional | Things not to include |
| Priority | yes | P0 / P1 / P2 |
| Status | yes | todo / generating / review / approved / integrated |

Template:

| Asset ID | Type | Purpose | State | Target Size | Format | Alpha | Output Path | Laya Usage | Text | Number | Style Notes | Avoid | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  | PNG |  |  | independent image | no | no |  |  | P0 | todo |

## 4. Single Asset Card

Use this when one asset needs more detail than the list table.

```text
Asset ID:
Screen ID:
Asset type:
Purpose:
State:
Target size:
Transparency:
Output path:
Laya usage:

Visual subject:
Shape language:
Main colors:
Material:
Lighting:
Outline:
Perspective:
Padding:

Text baked in:
Number baked in:
Must include:
Must avoid:
Reference assets:
Review notes:
```

## 5. Question Standard

When information is missing, ask only the smallest number of questions needed.

### Must Ask

Ask these only if they are missing and cannot be inferred:

| Question | Why |
| --- | --- |
| What screen is this asset for? | Determines context and size |
| Is it a background, icon, button, panel, or effect? | Determines generation mode |
| Does Laya reference it independently? | Determines whether to split into small PNG |
| Does it need transparency? | Determines background-removal workflow |
| Should text/numbers be baked into the image? | Usually no, but must confirm for special logos |
| Where should the final asset be saved? | Prevents wrong folder |

### Usually Infer

Do not ask if the answer is obvious from context:

| Field | Default |
| --- | --- |
| Style | project style profile |
| Text baked in | no |
| Number baked in | no |
| Format | PNG |
| Meta handling | do not generate manually |
| Icon output | independent PNG |
| Color palette | project palette |

### Good User Prompt Format

```text
我要做界面：battle_stage_map
用途：战斗过关/关卡选择
分辨率：750x1400
资源放置：
- 地图：assets/bigImg
- 图标：assets/ui/battleScene
资源列表：
- stage_node_normal，普通关卡节点，约160x120，透明PNG
- stage_node_current，当前关卡节点，约180x180，透明PNG
- stage_reward_chest，奖励宝箱，约160x160，透明PNG
要求：不烘焙文字和数字，统一Q版幻想RPG风格
```

## 6. Generation Workflow

### Step 1: Build The Table

Create or update the screen asset table first.

No generation starts until P0 assets have enough fields:

- Asset ID
- Type
- Purpose
- Target Size
- Alpha
- Output Path
- Laya Usage

### Step 2: Generate Style Sheet

For a new screen or new style group, generate a small style sheet first:

- 4-8 representative assets
- no final replacement yet
- review style only

### Step 3: Generate Final Independent Assets

After style approval:

- generate each final asset
- split sheets into independent PNGs if a sheet was used
- trim transparent padding consistently
- do not create `.meta`
- do not overwrite old assets unless explicitly approved

Fast local processing:

```bash
python tools/art/chroma_replace.py --input <temporary-source.png> --output assets/ui/path/asset.png --match-size assets/ui/path/asset.png
python tools/art/chroma_replace.py --input <temporary-source.png> --output assets/ui/path/new-asset.png --size 750x279
```

Use this after built-in image generation to remove the chroma-key background, crop transparent padding, resize to the old or target size, and save the final PNG in one step.

### Step 4: Review

Review each asset with the checklist:

| Check | Pass Criteria |
| --- | --- |
| Style | matches project style profile |
| Readability | clear at intended UI size |
| Silhouette | recognizable without text |
| Color | matches palette and state meaning |
| Alpha | transparent when required |
| Text | no accidental text |
| Numbers | no accidental numbers |
| Folder | saved in correct project path |
| Laya usage | independent file if referenced independently |
| Nine-slice | panels/buttons have simple stretchable center/edge areas |
| Reuse | uses common UI kit unless a unique asset is justified |
| Layering | UI is clearer/brighter than background but shares world style |

### Step 5: Integrate

Only after approval:

- update Laya UI references
- adjust scaling/anchors
- let Laya generate `.meta`
- review in actual screen

### Step 6: Replace Existing Assets

For existing project assets:

- The original asset filename is the final integration name.
- Generate temporary review/source files only during production.
- After style approval, replace the original PNG content directly and keep the existing `.meta` file/uuid whenever possible.
- Record every replaced asset in `docs/ArtAssetReplacementMap.md`.
- If a generated asset is useful for manual UI assembly and has no old filename, give it a formal role-based name such as `panel-bg.png`, `btn-bg-cyan.png`, or `bottom-panel.png`.
- Replace common assets before screen-specific duplicates.
- Delete source/trial/review/contact-sheet assets after the final integration asset is confirmed.
- When a screen must be rebuilt manually, keep asset names stable and document the intended use so the Laya editor assembly work is straightforward.

## 7. Battle Stage Map Trial

Use this table for today's first workflow test.

| Asset ID | Type | Purpose | State | Target Size | Format | Alpha | Output Path | Laya Usage | Text | Number | Style Notes | Avoid | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| battle_stage_map_forest | background | stage map background | normal | 750x1400 or larger portrait | PNG/JPG | no | `assets/bigImg/battle_stage_map_forest.png` | background | no | no | winding fantasy forest path | UI buttons, text, numbers | P0 | review |
| stage_node_normal | icon | normal stage node | normal | ~160x120 | PNG | yes | `assets/ui/battleScene/stage_node_normal.png` | independent image | no | no | stone pedestal | text, numbers | P0 | review |
| stage_node_clear | icon | cleared stage node | cleared | ~160x160 | PNG | yes | `assets/ui/battleScene/stage_node_clear.png` | independent image | no | no | golden star reward feeling | text, numbers | P0 | review |
| stage_node_current | icon | current selectable stage | selected | ~180x180 | PNG | yes | `assets/ui/battleScene/stage_node_current.png` | independent image | no | no | blue glow and crossed swords | text, numbers | P0 | review |
| stage_node_boss | icon | boss stage node | boss | ~180x180 | PNG | yes | `assets/ui/battleScene/stage_node_boss.png` | independent image | no | no | red boss marker | text, numbers | P0 | review |
| stage_reward_chest | icon | reward chest | reward | ~160x160 | PNG | yes | `assets/ui/battleScene/stage_reward_chest.png` | independent image | no | no | gold chest with gem | text, numbers | P0 | review |
| stage_route_flag | icon | route/progress marker | marker | ~140x180 | PNG | yes | `assets/ui/battleScene/stage_route_flag.png` | independent image | no | no | blue flag with gold accent | text, numbers | P1 | review |
| stage_lock | icon | locked stage mark | locked | ~96x96 | PNG | yes | `assets/ui/battleScene/stage_lock.png` | independent image | no | no | gold lock, readable at small size | text, numbers | P1 | review |
| stage_star_small | icon | star rating | reward | ~64x64 | PNG | yes | `assets/ui/battleScene/stage_star_small.png` | independent image | no | no | gold star, simple shape | text, numbers | P1 | review |
| btn_battle_start | button | enter battle button background | normal | ~260x100 | PNG | yes | `assets/ui/battleScene/btn_battle_start.png` | independent image or 9-slice | no | no | orange/gold glossy button | baked text | P0 | review |
| btn_battle_start_disabled | button | disabled enter battle button | disabled | ~260x100 | PNG | yes | `assets/ui/battleScene/btn_battle_start_disabled.png` | independent image or 9-slice | no | no | desaturated version | baked text | P1 | review |
| battle_title_plate | panel | title plate background | normal | ~420x110 | PNG | yes | `assets/ui/battleScene/battle_title_plate.png` | independent image | no | no | blue inner plate, gold border | baked text | P1 | review |

## 8. Common Magic UI Final Assets

Reusable common UI assets based on the western magic cute style. Intermediate sheets and contact sheets are deleted after final integration.

| Asset ID | Type | Purpose | State | Target Size | Format | Alpha | Output Path | Laya Usage | Text | Number | Style Notes | Avoid | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| panel-bg | panel | reusable common window panel | normal | flexible | PNG | yes | `assets/ui/common/imgs/panel-bg.png` | 9-slice/independent panel | no | no | western magic parchment panel, clean center | baked title crest, text | P0 | ready |
| panel-crest | overlay | reusable top/title ornament | normal | fixed | PNG | yes | `assets/ui/common/imgs/panel-crest.png` | independent overlay | no | no | magic academy crest with crystal | text | P1 | ready |
| btn-bg-yellow0 | button | reusable primary button | normal | flexible | PNG | yes | `assets/ui/common/imgs/btn-bg-yellow0.png` | 9-slice/button bg | no | no | honey-orange button | baked label | P0 | replaced |
| btn-bg-cyan | button | reusable secondary button | normal | flexible | PNG | yes | `assets/ui/common/imgs/btn-bg-cyan.png` | 9-slice/button bg | no | no | teal-blue button | baked label | P0 | ready |
| btn-bg-grey | button | reusable disabled button | disabled | flexible | PNG | yes | `assets/ui/common/imgs/btn-bg-grey.png` | 9-slice/button bg | no | no | grey-blue disabled state | baked label | P0 | ready |
| title-bg | panel | reusable title bar/title plate | normal | flexible | PNG | yes | `assets/ui/common/imgs/title-bg.png` | 9-slice/title bg | no | no | blue center with gold trim | text | P0 | replaced |
| view-bg-1 | panel | reusable horizontal information panel | normal | flexible | PNG | yes | `assets/ui/common/imgs/view-bg-1.png` | panel bg | no | no | clean magic panel | text | P0 | replaced |
| view-bg-2 | frame | reusable reward/item frame | normal | fixed | PNG | yes | `assets/ui/common/imgs/view-bg-2.png` | item/reward frame | no | no | clean center for icon overlay | text | P0 | replaced |

Review notes:

- Final assets should be stretched/tested in Laya before large-scale use.
- Keep text and numbers in Laya, not baked into images.

## 9. Assistant Behavior Rule

When the user asks for art assets:

1. Check whether a screen asset table exists.
2. If yes, use the table as the source of truth.
3. If fields are missing, ask only the missing must-ask fields.
4. Generate preview/style sheet before final batch when style is not locked.
5. Save final assets to the specified folders.
6. Do not manually create `.meta` files.
7. If replacing an existing asset, keep the original filename where practical.
8. Update `docs/ArtAssetReplacementMap.md` with asset purpose, replacement source, status, and notes.
9. Report final paths and any review concerns.
