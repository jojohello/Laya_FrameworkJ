# Item Module

## Scope

The first item step is a client-side foundation:

- `Item`: static item definition.
- `ItemMgr`: immutable item-definition access.
- `ItemProtocol`: placeholder for later server sync.

`BagMgr` provides the client projection of the server-authoritative bag. It owns
validated runtime counts, stack-aware slot capacity, and snapshot/delta reconciliation. It does not
create UI or load art resources. `BagViewController` presents that state as a
read-only main-scene page: category tabs (`All`, `Material`, `Consumable`,
`Equipment`) and the shared `ItemView` grid. It refreshes whenever `BagMgr`
accepts an authoritative snapshot or delta.

## Bag API

```ts
BagMgr.instance.getCount(itemId);
BagMgr.instance.getSnapshot();
BagMgr.instance.requestSnapshot();
BagMgr.instance.requestSnapshot(BagType.Warehouse);
BagMgr.instance.getCount(itemId, BagType.Warehouse);
```

The parameterless forms address `BagType.Main`. A warehouse is another `BagInfo`
instance in the same manager, not a separate warehouse implementation. Login/reconnect
eagerly installs only the main bag; warehouse is loaded on demand.

Gameplay code must not change bag quantities locally. `BagProtocol` uses generated
`BAG_SNAPSHOT_REQUEST/RESPONSE` IDs, while login/reconnect initialization and battle
settlement feed the same versioned contract into `BagMgr`. Item use, selling,
trading, and expansion are not part of the current contract.

`BagPayloads.generated.ts` is generated from `Protocol/contracts/bag/schema.json`.
Edit the Schema and run `Protocol/tools/npm.cmd run generate`; never edit the generated
interfaces or guards directly.

Item icons come from the client-only `Item.Icon` configuration path. Formal inventory
icons are `128x128` transparent PNG files under `ui/common/imgs/items/`. The bag renders
aggregate counts in `MaxStack`-bounded visual stacks, pads an underfilled page to 25 empty
slots, and enables vertical dragging only after the visual stack count exceeds one page.

## Tables

Source CSV file:

```txt
E:\Laya_FrameworkJ_laya3\Config\csv\Item.csv
```

The CSV `UsedSize` row marks `ID`, `Type`, `Quality`, `MaxStack` and
`UseAction` as `cs`, because these fields are also needed by the server.
`Name` and `Desc` are `c` client-only display text.

### Item

```txt
ID, Name, Type, Quality, MaxStack, UseAction, Desc
```

`UseAction` is a generic action script, so consumables can later trigger
healing, buffs, rewards or plot/guide effects without introducing another item
effect table.

`Type` should use stable English enum values:

- `Material`
- `Consumable`
- `Currency`
- `Equipment`

## Runtime Notes

`ItemData` only contains primitive fields. `ItemInfo` can contain helper methods.
Persistent item counts exist only in the server-authoritative bag projection; `ItemMgr`
has no local count mutation API. Battle settlement grants configured non-currency rewards through `BagService`; the
canonical snapshot/delta contract is `Protocol/contracts/bag/DESIGN.md`.
