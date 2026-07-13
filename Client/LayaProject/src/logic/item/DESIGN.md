# Item and Bag Design

`ItemMgr` and `BagMgr` form one logic module. `ItemMgr` reads immutable item
definitions from the `Item` config table. `BagMgr` owns runtime quantities and
is the public entry point for bag mutations.

`BagInfo` contains in-memory rules: positive integer counts, max-stack-aware
slot calculation, capacity checks, and primitive snapshots. It does not depend
on UI, scene objects, or the Start package. `BagProtocol` is the network
boundary reserved for a future server-authoritative implementation.

Registration order in `LogicMain` is intentional: `ConfigMgr`, `ItemMgr`, then
`BagMgr`. Do not put bag state in UI classes or import Start protocol
implementations directly into Logic.
