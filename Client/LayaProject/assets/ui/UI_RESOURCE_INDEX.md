# UI Resource Index

| Resource | Type | Purpose | Reuse notes |
|---|---|---|---|
| `ui/mainscene/systemBtn.lh` | `.lh` prefab | Main scene system-entry tab | Used by the `MainSceneView.ls` GList; `itemRenderer` assigns `loader_1.src` and `name_1.text` from each MainNav row; Radio selected state scales to `1.08` from the center |
| `ui/battlescene/HealthBar.lh` | `.lh` prefab | Battle health bar | Reusable battle HUD component |
| `ui/battlescene/BattleMainView.ls` | `.ls` scene | Full-screen battle HUD | Transparent screen UI; owns compact top-right 1×/2× speed, pause/back controls and pause overlay; clickable controls use GButton with static GImage children |
| `ui/battlescene/BattleVictoryView.ls` | `.ls` modal scene | Battle victory result screen | Owns the victory emblem, score, reward GList and claim action; each reward reuses `ItemView.lh`; opened as `BattleVictoryUI` |
| `ui/battlescene/BattleDefeatView.ls` | `.ls` modal scene | Battle defeat result screen | Owns the defeat gate, data-driven suggestion GList and return action; opened as `BattleDefeatUI` |
| `ui/common/ItemView.lh` | `.lh` prefab | Reusable item slot | Layered bottom frame, quality background, dynamic icon, quantity, red point and selected frame; driven by `ItemViewController` |
| `ui/battlescene/imgs/victory_emblem.png` | PNG | Victory result illustration | Transparent compact blue-crystal shield; UUID `bed03bfb-1c8d-481f-915f-ac13adb74a76`; text and score remain Laya nodes |
| `ui/battlescene/imgs/defeat_gate.png` | PNG | Defeat result illustration | Transparent `380x380` crying Q-version wizard with broken wand and magic sparkles; existing UUID `42c88f84-2df9-49d0-a8ef-82b24472bc50` is preserved |
| `ui/battlescene/imgs/btn_battle_speed.png` | PNG | Battle speed button background | Dedicated empty-center shield for runtime 1×/2× text; UUID `3b6045fd-fdd9-4783-bd8e-5ab994a6e4ac`, integrated by `BattleMainView.ls` |
| `ui/battlescene/imgs/btn_pause.png` | PNG | Battle pause button | Battle-specific silhouette and sizing; keep under the battle module |
| `ui/battlescene/imgs/btn_battle_back.png` | PNG | Return from battle to stage selection | Battle-specific navigation control; keep under the battle module |
| `ui/dialog/commonDialog.ls` | `.ls` modal layer | Full-screen modal mask and dialog panel | Open through `DialogMgr`; supports confirm-only and confirm/cancel callbacks |
| `ui/common/imgs/view-bg-1.png` | PNG | Canonical common window panel | Nine-slice outer panel reused by dialogs and battle-result information modules |
| `ui/common/imgs/surface-bg-cream.png` | PNG | Canonical warm-ivory surface and victory-result mask | `32x32` pure-color nine-slice; use for lightweight section/list surfaces and the bright victory `bg:GImage` through `.ls/.lh` nodes |
| `ui/common/imgs/surface-bg-blue.png` | PNG | Canonical cool defeat-result mask | `32x32` pure blue nine-slice; `BattleDefeatView` uses it at `alpha=0.88` to preserve a darker, low-saturation failure mood without adding a full-screen art background |
| `ui/common/imgs/title-bg.png` | PNG | Dialog/title bar | Reusable title decoration; labels remain runtime text |
| `ui/common/imgs/btn-bg-yellow0.png` | PNG | Primary action button | Confirm/positive action |
| `ui/common/imgs/btn-bg-grey.png` | PNG | Disabled button | Do not use as an active cancel button |
| `ui/common/imgs/btn-bg-cyan.png` | PNG | Secondary active button | Cancel/secondary action |
| `ui/common/imgs/btn-close.png` | PNG | Modal close button | Fixed GImage child of the CommonDialog close GButton |
| `ui/common/imgs/player-avatar-default.png` | PNG | Default player avatar for the main-scene profile bar | Imported UUID `a6851056-c313-42ac-acfb-ad62dbea71ca`; replaceable when account/avatar data is available |
| `ui/common/imgs/player-avatar-frame.png` | PNG | Canonical circular player portrait frame | UUID `09996515-04f6-4dc3-9184-d75cc1a62005`; compact dark metal/honey-gold/cyan frame reused by player UI |
| `ui/common/imgs/btn-add.png` | PNG | Canonical compact add icon | UUID `f017667b-622f-4a31-a727-78e287e80efb`; circular dark center, honey-gold rim, cyan plus |
| `ui/mainscene/playerProfile.lh` | `.lh` prefab | Compact top player HUD | Runtime is `TopPrefab`; fixed art uses GImage, replaceable player avatar uses GLoader, and add actions use GButton |
| `ui/mainscene/imgs/player-profile-bg.png` | PNG | Teal-blue horizontal support for the top HUD | Existing UUID `93b8cc92-6fce-4d61-8238-bdf46e83999f`; fixed-end strip using the shared honey-gold/cyan main-scene palette |
| `ui/mainscene/imgs/bottom-panel.png` | PNG | Main-scene bottom navigation panel | Dedicated 256×96 gray-blue nine-slice source, UUID `38c366c3-2c67-4c9e-8af4-9853bb9467cd`, `sizeGrid=[24,24,8,24,0]`; displayed at 750×279 behind warm navigation buttons |
| `ui/mainscene/imgs/icon-shop.png` | PNG | Main-scene shop navigation icon | Dedicated fantasy storefront icon, UUID `7e5dd6d7-2bb1-4c11-a3a2-1a57475b9be0`; MainNav runtime path is `ui/mainscene/imgs/icon-shop.png` |
| `ui/mainscene/imgs/player-level-badge.png` | PNG | Empty level medallion | Level number remains a Laya text node |
| `ui/common/imgs/currency-crystal.png` | PNG | Premium-currency icon | Common independent icon; current HUD slot displays zero until a formal currency Item is configured |
| `ui/common/imgs/currency-gold.png` | PNG | Gold currency icon | Reads Wallet Item ID 1001 in the current HUD |
| `ui/common/imgs/stamina-potion.png` | PNG | Player stamina icon | Reads the player initialization stamina field |
| `ui/common/imgs/exp-track.png` | PNG | Compact experience track | Used with a separately clipped/scaled fill image |
| `ui/common/imgs/exp-fill.png` | PNG | Compact green experience fill | The maximum experience source still needs a formal level configuration |
| `ui/mainscene/MainSceneView.ls` | `.ls` scene | Main scene container | Loads `playerProfile.lh`, passes player data to `TopPrefab`, and owns main-scene system-entry behavior |

## Selection rule

Use `.lh` for reusable visual components and `.ls` for complete pages or modal layer containers. Do not invent `res://` UUIDs; inspect the neighboring `.meta` file first. Runtime resource paths omit `assets/`.

Use one Controller to switch states only when the page keeps the same information structure. Victory and defeat use separate `.ls` scenes and Controllers because their content regions and future actions differ; shared visual units such as Item remain common `.lh` prefabs.

Fixed local art uses `GImage`; `GLoader` is reserved for runtime-replaceable, asynchronous, or remote images. Any node with click semantics uses `GButton`, with fixed `GImage` or dynamic `GLoader` children as appropriate. Ordinary buttons shrink from their center when pressed: `0.92` for regular controls and `0.9` for compact icon controls. Selection-style tabs instead keep the active location visibly stronger; the main-navigation tab scales its Radio selected state to `1.08`. Create a shared button prefab or behavior only when the complete visual or compound behavior is reused across screens.
