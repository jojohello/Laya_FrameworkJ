# Item Module

## Scope

The first item step is a client-side foundation:

- `Item`: static item definition.
- `ItemMgr`: config access and local count container.
- `addItem / consumeItem / setItemCount`: basic item amount operations.
- `ItemProtocol`: placeholder for later server sync.

`BagMgr` provides the first local Bag foundation. It owns runtime counts,
stack-aware slot capacity, and primitive snapshot import/export. It does not
create UI or load art resources.

## Bag API

```ts
BagMgr.instance.addItem(itemId, count, "reward");
BagMgr.instance.removeItem(itemId, count, "use");
BagMgr.instance.getCount(itemId);
BagMgr.instance.getSnapshot();
BagMgr.instance.loadSnapshot(snapshot);
```

The bag is currently local. Server-authoritative persistence, message IDs and
item-use effects remain behind `BagProtocol` until the server contract is fixed.

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
`ItemMgr` keeps local counts only for early gameplay and reward plumbing. Battle
settlement already grants configured non-currency rewards through the server bag repository, but a general
incremental bag snapshot/delta contract is still required before local bag state can be treated as authoritative.
