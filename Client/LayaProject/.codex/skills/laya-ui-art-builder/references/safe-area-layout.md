# Safe-Area Layout

Use this reference for this project's portrait LayaAir 3 UI adaptation.

## Runtime Contract

- Keep `750x1334` and `fixedwidth` as the design baseline. The Stage stays full viewport; mobile long screens do not receive black bars.
- Detect runtime capabilities, not device model names. Prefer mini-game platform `safeArea`, use CSS `env(safe-area-inset-*)` on Web, and treat ratio fallback as estimated evidence only.
- Convert platform or CSS pixels to Stage coordinates with the single `fixedwidth` scale `stageWidth / windowWidth`.
- Full-bleed painted backgrounds use uniform cover and may crop low-information edges. Pure fills, masks, and verified nine-slice resources may stretch. Do not non-uniformly scale painted art.

## Page Structure

Every adaptive `.ls` page uses these roles:

1. The Scene root fills the Stage.
2. Full-bleed backgrounds and masks relate to the Scene root and use a name beginning with `fullBleed`.
3. One direct ordinary `GBox` named `safeAreaRoot` keeps the design rectangle `0,0,750,1334`. It is an invisible geometry guide with no Relations.
4. Root-level safe content relates to `safeAreaRoot`. It may remain a sibling of the guide; reparenting existing serialized nodes is not required and can break generated bindings or controller lookups.
5. Children inside a moved group relate only to that local group, never back to the Scene root or safeAreaRoot.

`SafeAreaLayout` exclusively writes `safeAreaRoot.x/y/width/height`. Business controllers handle data, state, and interaction; they do not subscribe to screen changes and write safe-area coordinates.

## Relation Ownership

One node axis has one owner.

- Top HUD: `Top_Top` and the required horizontal Relation to `safeAreaRoot`.
- Bottom navigation or action: `Bottom_Bottom` and the required horizontal Relation to `safeAreaRoot`.
- Centered dialog/result content: `Center_Center` + `Middle_Middle` to `safeAreaRoot`.
- A panel or list that grows vertically: `Top_Top` + `BottomExt_Bottom` to `safeAreaRoot`.
- Full-screen background/mask: `Width` + `Height` to the Scene root, unless a uniform-cover component already owns both axes.

Never combine a controller write and a Relation on the same axis. Never move a group for the safe area while its children also relate to the outer root on that axis; that applies the viewport delta twice.

## Mini-Game Capsule

A top-right system capsule is not representable by one global safe rectangle. Name the root-level control group `menuButtonAvoidanceRoot`:

- its horizontal axis uses `Right_Right -> safeAreaRoot`;
- it has no vertical Relation;
- `SafeAreaLayout` owns its vertical axis and places it below the greater of the safe top or capsule bottom plus the standard gap.

## Integration And Validation

Logic pages opened by `UIManager` and Start login/loading entries bind the component centrally through `ScreenAdapter.bind(scene)`. If a new adaptive scene uses another loading path, add binding at that loader boundary, not in its business controller.

After editing adaptive `.ls/.lh` files:

```powershell
powershell -ExecutionPolicy Bypass -File tools/ui/validate-safe-area-relations.ps1
npx.cmd tsc -p tsconfig.json --noEmit --pretty false
```

Then inspect the page in LayaAir IDE and on representative devices or simulators. At minimum verify the design ratio and one long-screen ratio; also verify top cutout, bottom gesture area, mini-game capsule, pointer hit areas, and full-bleed crop behavior. Static checks cannot replace the visual/device pass.
