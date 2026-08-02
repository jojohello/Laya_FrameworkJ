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
| `assets/ui/common/imgs/view-bg-1.png` | Canonical common window panel | generated v4 panel | 505x166 | 9-slice panel bg | integrated | Kept old meta/UUID; `sizeGrid=[65,72,66,76,0]`. Reused by CommonDialog and battle-result outer panels, replacing the redundant un-sliced panel asset. |
| `assets/ui/common/imgs/surface-bg-cream.png` | Canonical plain section/content surface | project-generated pure cream fill | 32x32 | 9-slice surface | integrated | IDE UUID `43f87ea2-ca0d-4322-a165-4abb7bc183f6`, `sizeGrid=[1,1,1,1,0]`. Reused by the victory and defeat `.ls` files; size and alpha stay declarative rather than Controller-drawn. |
| `assets/ui/common/imgs/surface-bg-blue.png` | Canonical translucent battle-result mask | project-generated pure desaturated blue fill | 32x32 | 9-slice surface | integrated | IDE UUID `0a7c3be5-1c66-4281-be69-20cb3b133418`, `sizeGrid=[1,1,1,1,0]`. Victory and defeat each declare one identical full-screen `bg:GImage` in `.ls`; it supplies the visible mask and input interception, replacing separate mask nodes and Controller drawing. |
| `assets/ui/common/imgs/view-bg-2.png` | Small reward/item frame or small panel | generated v4 reward frame | 177x178 | item/reward frame | replaced | Kept old meta/uuid. Center kept clean for item icons. |
| `assets/ui/common/imgs/btn-add.png` | Canonical compact add icon | unified top-HUD production sheet | 28x28 | independent icon | replaced | Kept the common meta/UUID; supersedes the redundant HUD-specific copy. |
| `assets/ui/common/imgs/player-avatar-frame.png` | Canonical circular player portrait frame | unified top-HUD production sheet | 88x88 | independent overlay | replaced | Kept the common meta/UUID; supersedes the redundant main-scene copy. |
| `assets/ui/common/imgs/currency-crystal.png` | Premium-currency icon | approved top-HUD production sheet | 44x56 | independent icon | ready | No baked amount; formal currency Item remains to be configured. |
| `assets/ui/common/imgs/currency-gold.png` | Gold currency icon | approved top-HUD production sheet | 52x52 | independent icon | ready | Wallet balance uses Item ID 1001. |
| `assets/ui/common/imgs/stamina-potion.png` | Stamina icon | approved top-HUD production sheet | 54x58 | independent icon | ready | No baked amount or maximum. |
| `assets/ui/common/imgs/exp-track.png` | Compact EXP track | approved top-HUD production sheet | 196x22 | independent bar background | ready | Dark track with restrained gold edge. |
| `assets/ui/common/imgs/exp-fill.png` | Compact EXP fill | approved top-HUD production sheet | 190x14 | independent bar fill | ready | Green fill kept separate from the track. |
| `assets/ui/common/imgs/btn-setting.png` | Settings button icon | generated v4 settings icon | 142x143 | independent button icon | replaced | Kept old meta/uuid. Slight cyan edge is acceptable at target size; revisit if visible in UI. |
| `assets/ui/common/imgs/red-point.png` | Notification red dot | generated v4 red point | 80x81 | independent notification icon | replaced | Kept old meta/uuid. No baked symbol/text. |
| `assets/ui/common/imgs/panel-crest.png` | Optional top panel crest overlay | generated v4 crest | 220x90 | independent overlay | ready | New formal asset for manual Laya assembly. |
| `assets/ui/common/imgs/btn-bg-cyan.png` | Common secondary button background | generated v4 secondary button | 260x97 | 9-slice/button bg | ready | New formal asset. |
| `assets/ui/common/imgs/btn-bg-grey.png` | Common disabled button background | generated v4 disabled button | 260x98 | 9-slice/button bg | ready | New formal asset. |

## Main Scene Assets

| Final Asset | Purpose | Replacement Source | Size | Laya Usage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `assets/ui/mainscene/imgs/btn-bg-yellow.png` | Main scene feature button background | generated v4 square button, tone adjusted for scene separation | 289x284 | system button bg | replaced | Kept old meta/uuid. Added stronger warm edge and soft dark grounding so buttons read over bright scene backgrounds. |
| `assets/ui/mainscene/imgs/bottom-panel.png` | Main scene bottom dock panel | generated nine-slice source from current top-HUD feedback | 256x96 | 9-slice bottom dock bg displayed at 750x279 | integrated | IDE runtime result accepted. Existing UUID preserved; dark desaturated gray-blue center, `alpha=0.92`, and `sizeGrid=[24,24,8,24,0]` keep the foreground tabs readable without deforming the border. |
| `assets/ui/mainscene/imgs/icon-world.png` | World/map feature icon | generated v4 magic orb map icon | 213x200 | system button icon | replaced | Kept old meta/uuid. Matches the reference screenshot direction. |
| `assets/ui/mainscene/imgs/icon-box.png` | Reward/box feature icon | generated v4 magic reward chest icon | 182x192 | system button icon | replaced | Kept old meta/uuid. Slightly bright; acceptable for reward entry. |
| `assets/ui/mainscene/imgs/icon-cup.png` | Ranking/cup feature icon | generated v4 trophy icon | 234x189 | system button icon | replaced | Kept old meta/uuid. Gold is bright; revisit only if it overpowers UI in screen. |
| `assets/ui/mainscene/imgs/icon-flag.png` | Task/flag feature icon | generated v4 task flag icon | 235x244 | system button icon | replaced | Kept old meta/uuid. |
| `assets/ui/mainscene/imgs/icon-battle.png` | Battle/arena entrance feature icon | generated v4 crossed swords arena icon | 220x210 | system button icon | integrated | IDE-generated UUID `dfc34c75-760c-4f20-a69b-8778161828c7`; MainNav uses it for the battle-stage entrance. |
| `assets/ui/mainscene/imgs/icon-shop.png` | Main-scene shop entrance icon | generated from the accepted main-navigation icon style | 240x240 | system button icon | integrated | IDE-generated UUID `7e5dd6d7-2bb1-4c11-a3a2-1a57475b9be0`; MainNav uses this dedicated storefront instead of the ranking trophy. |
| `assets/ui/mainscene/imgs/player-profile-bg.png` | Compact top-HUD support strip | unified top-HUD production sheet | 520x54 | fixed horizontal background | replaced | Desaturated teal-blue center with shared honey-gold/cyan treatment; existing UUID preserved. |
| `assets/ui/mainscene/imgs/player-level-badge.png` | Empty level badge | unified top-HUD production sheet | 36x36 | independent overlay | replaced | Level text is rendered by Laya. |

## Bag UI Assets

| Final Asset | Purpose | Replacement Source | Size | Laya Usage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `assets/ui/bag/imgs/tab-selected.png` | Selected Bag category-tab background | Generated dedicated embedded-page tab in locked v4 direction | 180x72 | Fixed-size `GLoader` background | integrated | IDE UUID `578c564c-160c-4f86-b94c-ac3bf78fbf93`; cyan open-page surface with soft gold rim, rendered at the same position and size as inactive tabs. Laya renders labels. |
| `assets/ui/bag/imgs/tab-normal.png` | Unselected Bag category-tab background | Generated dedicated embedded-page tab in locked v4 direction | 180x72 | Fixed-size `GLoader` background | integrated | IDE UUID `83a1cbfa-a91d-4875-a718-0003495e0762`; muted brown closed-page surface, rendered at the same position and size as the selected tab. Laya renders labels. |

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
| `assets/ui/battlescene/imgs/stage_node_normal.png` | Normal stage node | generated v4 stage node | 368x270 | independent icon | replaced | Final integrated asset only. |
| `assets/ui/battlescene/imgs/stage_node_clear.png` | Cleared stage node | generated v4 cleared node | 344x342 | independent icon | replaced | Final integrated asset only. |
| `assets/ui/battlescene/imgs/stage_node_current.png` | Current selectable stage node | generated v4 current node | 355x363 | independent icon | replaced | Final integrated asset only. |
| `assets/ui/battlescene/imgs/stage_node_boss.png` | Boss stage node | generated v4 boss node | 363x411 | independent icon | replaced | Red remains reserved for danger/boss. |
| `assets/ui/battlescene/imgs/stage_reward_chest.png` | Stage reward chest | generated v4 reward chest | 350x326 | independent icon | replaced | Final integrated asset only. |
| `assets/ui/battlescene/imgs/battle_title_plate.png` | Battle title plate | existing v4-style formal asset | 502x296 | title bg | ready | Looks consistent with current style. Use Laya text for labels. |
| `assets/ui/battlescene/imgs/btn_battle_start.png` | Battle start button | existing v4-style formal asset | 505x227 | button bg | ready | Center clean for Laya text. |
| `assets/ui/battlescene/imgs/btn_battle_start_disabled.png` | Disabled battle start button | existing v4-style formal asset | 485x220 | button bg | ready | Center clean for Laya text. |
| `assets/ui/battlescene/imgs/stage_lock.png` | Stage lock icon | existing v4-style formal asset | 268x327 | independent icon | ready | Consistent enough; no current replacement needed. |
| `assets/ui/battlescene/imgs/stage_route_flag.png` | Stage route/marker flag | existing v4-style formal asset | 317x389 | independent icon | ready | Consistent enough; no current replacement needed. |
| `assets/ui/battlescene/imgs/stage_star_small.png` | Stage star/reward star | existing v4-style formal asset | 292x280 | independent icon | ready | Consistent enough; no current replacement needed. |

## Battle HUD Assets

| Final Asset | Purpose | Replacement Source | Size | Laya Usage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `assets/ui/battlescene/imgs/btn_battle_speed.png` | Battle speed selector background | generated from the accepted battle HUD shield style | 96x108 | independent button background with runtime 1×/2× text | integrated | IDE-generated UUID `3b6045fd-fdd9-4783-bd8e-5ab994a6e4ac`; `BattleMainView.ls` renders the changing multiplier as Laya text. |
| `assets/ui/battlescene/imgs/btn_pause.png` | Pause/resume battle | generated battle HUD production sheet | 96x108 | independent button icon | integrated | Dark teal-blue battle control with honey-gold rim and cyan magic accent; `BattleMainView.ls` uses the imported UUID. |
| `assets/ui/battlescene/imgs/btn_battle_back.png` | Return to battle-stage selection | generated battle HUD production sheet | 96x108 | independent button icon | integrated | Matches the pause button; battle-only navigation semantics keep it out of common assets. |
| `assets/ui/battlescene/imgs/victory_emblem.png` | Victory result illustration | generated blue-crystal shield cutout in the locked v4 direction | 1536x1024 | fixed transparent GImage art | replaced | Existing UUID `bed03bfb-1c8d-481f-915f-ac13adb74a76` preserved; displayed compactly at `380x253` over the battle scene, with no baked text or numbers. |
| `assets/ui/battlescene/imgs/defeat_gate.png` | Defeat result character illustration | generated v4 Q-version crying wizard with broken wand and cyan magic sparks | 380x380 | fixed GImage art | replaced | Transparent production-size cutout; existing UUID `42c88f84-2df9-49d0-a8ef-82b24472bc50` preserved. Filename is retained for resource compatibility even though the subject is no longer a gate. |

## Battle Character Assets

| Final Asset | Purpose | Replacement Source | Size | Laya Usage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `assets/character/1001/character-animation.png` | Warrior idle/walk/attack atlas texture | unified battle-character production sheet | 768x960 | `.atlas` frame animation with paired team masks | ready | Neutral base palette supports runtime RGB team tint. |
| `assets/character/1002/character-animation.png` | Mage idle/walk/attack atlas texture | unified battle-character production sheet | 768x960 | `.atlas` frame animation with paired team masks | ready | Staff and pointed hat preserve class readability after tint. |
| `assets/character/1003/character-animation.png` | Priest idle/walk/attack atlas texture | unified battle-character production sheet | 768x960 | `.atlas` frame animation with paired team masks | ready | Cream robe and healing staff preserve class readability after tint. |

## Cleanup Rule

Temporary trial, review, source, contact-sheet, and comparison PNGs are removed after the final integration asset is produced. Keep only final project assets under `assets/` and the text production rules in this document.
