# UI Resource Index

| Resource | Type | Purpose | Reuse notes |
|---|---|---|---|
| `ui/mainscene/systemBtn.lh` | `.lh` prefab | Main scene system entry button | Used by `MainSceneView.ls` GList; contains `loader_1` and `name_1` |
| `ui/battleScene/HealthBar.lh` | `.lh` prefab | Battle health bar | Reusable battle HUD component |
| `ui/dialog/commonDialog.ls` | `.ls` modal layer | Full-screen modal mask and dialog panel | Open through `DialogMgr`; supports confirm-only and confirm/cancel callbacks |
| `ui/common/imgs/panel-bg.png` | PNG | Western magic parchment panel | Reusable panel background; UUID must be read from `.meta` |
| `ui/common/imgs/title-bg.png` | PNG | Dialog/title bar | Reusable title decoration; labels remain runtime text |
| `ui/common/imgs/btn-bg-yellow0.png` | PNG | Primary action button | Confirm/positive action |
| `ui/common/imgs/btn-bg-grey.png` | PNG | Disabled button | Do not use as an active cancel button |
| `ui/common/imgs/btn-bg-cyan.png` | PNG | Secondary active button | Cancel/secondary action |
| `ui/common/imgs/btn-close.png` | PNG | Modal close button | Runtime-loaded by `CommonDialog`; LayaAir IDE should generate its `.meta` on import |
| `ui/common/imgs/player-avatar-default.png` | PNG | Default player avatar for the main-scene profile bar | Imported UUID `a6851056-c313-42ac-acfb-ad62dbea71ca`; replaceable when account/avatar data is available |
| `ui/common/imgs/player-avatar-frame.png` | PNG | Canonical circular player portrait frame | UUID `09996515-04f6-4dc3-9184-d75cc1a62005`; compact dark metal/honey-gold/cyan frame reused by player UI |
| `ui/common/imgs/btn-add.png` | PNG | Canonical compact add icon | UUID `f017667b-622f-4a31-a727-78e287e80efb`; circular dark center, honey-gold rim, cyan plus |
| `ui/mainscene/playerProfile.lh` | `.lh` prefab | Compact top player HUD | Runtime is `TopPrefab`; owns player-name and level display, and is instanced by `MainSceneView.ls` |
| `ui/mainscene/imgs/player-profile-bg.png` | PNG | Teal-blue horizontal support for the top HUD | Existing UUID `93b8cc92-6fce-4d61-8238-bdf46e83999f`; fixed-end strip using the shared honey-gold/cyan main-scene palette |
| `ui/mainscene/imgs/player-level-badge.png` | PNG | Empty level medallion | Level number remains a Laya text node |
| `ui/common/imgs/currency-crystal.png` | PNG | Premium-currency icon | Common independent icon; current HUD slot displays zero until a formal currency Item is configured |
| `ui/common/imgs/currency-gold.png` | PNG | Gold currency icon | Reads Wallet Item ID 1001 in the current HUD |
| `ui/common/imgs/stamina-potion.png` | PNG | Player stamina icon | Reads the player initialization stamina field |
| `ui/common/imgs/exp-track.png` | PNG | Compact experience track | Used with a separately clipped/scaled fill image |
| `ui/common/imgs/exp-fill.png` | PNG | Compact green experience fill | The maximum experience source still needs a formal level configuration |
| `ui/mainscene/MainSceneView.ls` | `.ls` scene | Main scene container | Loads `playerProfile.lh`, passes player data to `TopPrefab`, and owns main-scene system-entry behavior |

## Selection rule

Use `.lh` for reusable visual components and `.ls` for complete pages or modal layer containers. Do not invent `res://` UUIDs; inspect the neighboring `.meta` file first. Runtime resource paths omit `assets/`.
