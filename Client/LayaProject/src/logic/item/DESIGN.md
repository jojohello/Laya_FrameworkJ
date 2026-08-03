# Item and Bag Design

`ItemMgr` and `BagMgr` form one logic module. `ItemMgr` reads immutable item
definitions from the `Item` config table. `BagMgr` owns only the client projection
of server-authoritative runtime quantities; it has no public gameplay mutation API.

`BagInfo` contains in-memory rules: positive integer counts, max-stack-aware
slot calculation, capacity checks, and primitive snapshots. It does not depend
on UI, scene objects, or the Start package. `BagProtocol` requests authoritative
snapshots and routes responses into `BagMgr`.

`BagMgr` owns a map of `BagType` to reusable `BagInfo` runtime instances. Main bag
APIs keep `BagType.Main` as the compatibility default; warehouse callers pass
`BagType.Warehouse`. Capacity, items, and version are isolated per instance.
Login initialization atomically installs the eager main snapshot, while warehouse
remains unknown until its first explicit snapshot request.

`BagMgr` atomically validates and applies full snapshots. It applies a delta only
when `baseVersion` equals the local version and the result version is consecutive;
stale deltas are ignored and gaps trigger a snapshot request for that bag type.
Battle settlement applies `bagDelta` on first settlement or `bagSnapshot` on an
idempotent repeat. UI reads manager state and refreshes through change listeners.

`BagViewController` expands each authoritative aggregate count into visual stacks using
the configured `MaxStack`; it never writes the split result back to `BagMgr`. The `FlowX`
viewport derives its visible columns and rows from the current list size, item size,
padding, and gaps. Fewer stacks are padded with empty `ItemView` slots to fill that
computed page, and vertical touch/bounce scrolling is enabled only when the padded row
count exceeds the visible page.
An open page listens to main-bag changes and rerenders accepted snapshots or deltas.
The serialized `GList` must retain `_templateNode` pointing at `bag-item-template`;
having a child that merely looks like a template is insufficient because increasing
`numItems` asks the list pool to clone through this mapping.

`ItemView.lh` keeps the quality color below the dynamic icon. Runtime item images use
the LayaAir 3 `GLoader.src` property and `LoaderFitMode.Contain`; do not use the legacy
`url`/`fit` fields, which leave the shared inventory and reward icon empty.

Wire interfaces and structural guards come only from `BagPayloads.generated.ts`,
which is generated from `Protocol/contracts/bag/schema.json`. `BagMgr` first applies
the generated structural guard, then enforces semantic rules such as unique item IDs,
configured item existence, capacity, and version continuity. Do not hand-write a
parallel bag wire interface in this module.

Registration order in `LogicMain` is intentional: `ConfigMgr`, `ItemMgr`, then
`BagMgr`. Do not put bag state in UI classes or import Start protocol
implementations directly into Logic.
