# Art Asset Replacement Map

## Purpose

This document records the current meaning, replacement source, and integration status of art assets.

Rules:

- Keep original filenames as final integration names when possible.
- Keep existing `.meta` files and UUIDs when replacing PNG content.
- Do not keep `_v4`, review, source, contact-sheet, or comparison PNGs after the final asset has replaced the integration filename.
- Update this file whenever an asset is generated, replaced, renamed, or marked obsolete.
- Laya text should render labels and numbers; avoid baked text/numbers in images.

## Locked Style

- Style baseline: v4 locked text style. Trial/contact images have been removed after final integration.
- Direction: bright clean cute Q-version western magic UI, low-to-medium saturation, soft honey-gold, cyan, cream, mint, clean outlines, nine-slice-friendly centers.

## Common UI Assets

| Final Asset | Purpose | Replacement Source | Size | Laya Usage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `assets/ui/common/imgs/btn-bg-yellow0.png` | Common primary button background | generated v4 primary button | 465x182 | 9-slice/button bg | replaced | Kept old meta/uuid. |
| `assets/ui/common/imgs/title-bg.png` | Common title bar/title plate background | generated v4 title bar | 540x132 | 9-slice/title bg | replaced | Kept old meta/uuid. |
| `assets/ui/common/imgs/view-bg-1.png` | Common horizontal panel/background plate | generated v4 panel | 505x166 | panel bg | replaced | Kept old meta/uuid. Because the old asset is shallow, use this as a horizontal info panel. |
| `assets/ui/common/imgs/view-bg-2.png` | Small reward/item frame or small panel | generated v4 reward frame | 177x178 | item/reward frame | replaced | Kept old meta/uuid. Center kept clean for item icons. |
| `assets/ui/common/imgs/btn-add.png` | Add button icon | generated v4 add button | 99x98 | independent button icon | replaced | Kept old meta/uuid. |
| `assets/ui/common/imgs/btn-setting.png` | Settings button icon | generated v4 settings icon | 142x143 | independent button icon | replaced | Kept old meta/uuid. Slight cyan edge is acceptable at target size; revisit if visible in UI. |
| `assets/ui/common/imgs/red-point.png` | Notification red dot | generated v4 red point | 80x81 | independent notification icon | replaced | Kept old meta/uuid. No baked symbol/text. |
| `assets/ui/common/imgs/panel-bg.png` | Large common window panel for manual assembly | generated v4 panel | 640x399 | independent/9-slice panel | ready | New formal asset. Use for large windows instead of stretching `view-bg-1.png`. |
| `assets/ui/common/imgs/panel-crest.png` | Optional top panel crest overlay | generated v4 crest | 220x90 | independent overlay | ready | New formal asset for manual Laya assembly. |
| `assets/ui/common/imgs/btn-bg-cyan.png` | Common secondary button background | generated v4 secondary button | 260x97 | 9-slice/button bg | ready | New formal asset. |
| `assets/ui/common/imgs/btn-bg-grey.png` | Common disabled button background | generated v4 disabled button | 260x98 | 9-slice/button bg | ready | New formal asset. |

## Main Scene Assets

| Final Asset | Purpose | Replacement Source | Size | Laya Usage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `assets/ui/mainscene/imgs/btn-bg-yellow.png` | Main scene feature button background | generated v4 square button, tone adjusted for scene separation | 289x284 | system button bg | replaced | Kept old meta/uuid. Added stronger warm edge and soft dark grounding so buttons read over bright scene backgrounds. |
| `assets/ui/mainscene/imgs/bottom-panel.png` | Main scene bottom dock panel | generated v4 bottom panel, tone adjusted for scene separation | 750x279 | bottom dock bg | ready | New formal asset. Center shifted slightly toward pale cyan/cream for better separation from castle stone backgrounds. |
| `assets/ui/mainscene/imgs/icon-world.png` | World/map feature icon | generated v4 magic orb map icon | 213x200 | system button icon | replaced | Kept old meta/uuid. Matches the reference screenshot direction. |
| `assets/ui/mainscene/imgs/icon-box.png` | Reward/box feature icon | generated v4 magic reward chest icon | 182x192 | system button icon | replaced | Kept old meta/uuid. Slightly bright; acceptable for reward entry. |
| `assets/ui/mainscene/imgs/icon-cup.png` | Ranking/cup feature icon | generated v4 trophy icon | 234x189 | system button icon | replaced | Kept old meta/uuid. Gold is bright; revisit only if it overpowers UI in screen. |
| `assets/ui/mainscene/imgs/icon-flag.png` | Task/flag feature icon | generated v4 task flag icon | 235x244 | system button icon | replaced | Kept old meta/uuid. |
| `assets/ui/mainscene/imgs/icon-battle.png` | Battle/arena entrance feature icon | generated v4 crossed swords arena icon | 220x210 | system button icon | ready | New formal asset for opening the battlefield screen. Let Laya generate `.meta`. |

## Big Image Assets

| Final Asset | Purpose | Replacement Source | Size | Laya Usage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `assets/bigImg/loading_bg.png` | Loading/login background | generated v4 framework loading background | 750x1400 | full-screen background | replaced | Retains the `Framework-J` wordmark and centered wizard identity. Lower third kept clean for login inputs and loading/progress UI. |
| `assets/bigImg/battle_stage_map_forest.png` | Battle stage map background | generated v4 forest stage map | 918x1713 | full-screen battle stage map | replaced | No baked text. Softer background contrast so stage nodes and buttons can read clearly. |

## Startup UI Assets

| Final Asset | Purpose | Replacement Source | Size | Laya Usage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `assets/startupUI/login/imgs/btn_bg_blue.png` | Login/startup blue button background | generated v4 button | 179x60 | 9-slice/button bg | replaced | Compact button with cleaner center for Laya text. |
| `assets/startupUI/login/imgs/input-bg.png` | Login input background | generated v4 input field | 59x40 | 9-slice/input bg | replaced | Center kept simple for horizontal extension. |
| `assets/startupUI/login/imgs/up.png` | Login dropdown up arrow | generated v4 small arrow | 17x10 | independent icon | replaced | Size preserved. |
| `assets/startupUI/login/imgs/down.png` | Login dropdown down arrow | generated v4 small arrow | 17x10 | independent icon | replaced | Size preserved. |
| `assets/startupUI/loading/imgs/blood_bg.png` | Loading progress bar track | generated v4 progress track | 145x12 | progress bar bg | replaced | Size preserved. |
| `assets/startupUI/loading/imgs/blood_blue.png` | Loading progress blue fill | generated v4 progress fill | 53x6 | progress fill | replaced | Size preserved. |
| `assets/startupUI/loading/imgs/blood_red.png` | Loading progress red fill | generated v4 progress fill | 53x6 | progress fill | replaced | Size preserved. |
| `assets/startupUI/startup/imgs/blood_bg.png` | Startup progress bar track | generated v4 progress track | 145x12 | progress bar bg | replaced | Matches loading progress assets. |
| `assets/startupUI/startup/imgs/blood_blue.png` | Startup progress blue fill | generated v4 progress fill | 53x6 | progress fill | replaced | Matches loading progress assets. |
| `assets/startupUI/startup/imgs/blood_red.png` | Startup progress red fill | generated v4 progress fill | 53x6 | progress fill | replaced | Matches loading progress assets. |

## Map Assets

| Final Asset | Purpose | Replacement Source | Size | Laya Usage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `assets/map/map001/map001.png` | Wide map/scene background | generated v4 magic kingdom background | 2848x1505 | map background | replaced | No baked UI/text. Wide composition preserved with softer magic kingdom styling. |
| `assets/map/map002/floor.png` | Fight map floor/tile texture sheet | generated v4 floor tileset repaint | 512x384 | tile/floor resource | replaced | Dimensions preserved. Kept tileset-like layout and semantic regions; verify in-map alignment in Laya if tile coordinates are strict. |

## Battle Stage Assets

| Final Asset | Purpose | Replacement Source | Size | Laya Usage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `assets/ui/battle/stage_node_normal.png` | Normal stage node | generated v4 stage node | 368x270 | independent icon | replaced | Final integrated asset only. |
| `assets/ui/battle/stage_node_clear.png` | Cleared stage node | generated v4 cleared node | 344x342 | independent icon | replaced | Final integrated asset only. |
| `assets/ui/battle/stage_node_current.png` | Current selectable stage node | generated v4 current node | 355x363 | independent icon | replaced | Final integrated asset only. |
| `assets/ui/battle/stage_node_boss.png` | Boss stage node | generated v4 boss node | 363x411 | independent icon | replaced | Red remains reserved for danger/boss. |
| `assets/ui/battle/stage_reward_chest.png` | Stage reward chest | generated v4 reward chest | 350x326 | independent icon | replaced | Final integrated asset only. |
| `assets/ui/battle/battle_title_plate.png` | Battle title plate | existing v4-style formal asset | 502x296 | title bg | ready | Looks consistent with current style. Use Laya text for labels. |
| `assets/ui/battle/btn_battle_start.png` | Battle start button | existing v4-style formal asset | 505x227 | button bg | ready | Center clean for Laya text. |
| `assets/ui/battle/btn_battle_start_disabled.png` | Disabled battle start button | existing v4-style formal asset | 485x220 | button bg | ready | Center clean for Laya text. |
| `assets/ui/battle/stage_lock.png` | Stage lock icon | existing v4-style formal asset | 268x327 | independent icon | ready | Consistent enough; no current replacement needed. |
| `assets/ui/battle/stage_route_flag.png` | Stage route/marker flag | existing v4-style formal asset | 317x389 | independent icon | ready | Consistent enough; no current replacement needed. |
| `assets/ui/battle/stage_star_small.png` | Stage star/reward star | existing v4-style formal asset | 292x280 | independent icon | ready | Consistent enough; no current replacement needed. |

## Cleanup Rule

Temporary trial, review, source, contact-sheet, and comparison PNGs are removed after the final integration asset is produced. Keep only final project assets under `assets/` and the text production rules in this document.
