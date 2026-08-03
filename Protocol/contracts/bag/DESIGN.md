# 背包跨端契约

`schema.json` 是本契约 wire 字段、条件必填、消息绑定和生成类型的唯一来源。本文件只补充无法由 Schema 完整表达的权威、事务、排序、版本连续性和兼容语义。

## 作用域与结果

本契约让登录初始化、主动重拉、断线重连和战斗结算共享同一套服务端权威容器状态。一个 Player 拥有一个逻辑 `BagMgr`，其中按生成枚举 `BagType` 管理多个相互隔离的 Bag 实例；当前类型为 `main` 与 `warehouse`，每种类型至多一个实例。玩家看到的容量、物品数量和版本均来自 Game Server；客户端只缓存、校验、协调重拉并驱动 UI。

当前不包含物品使用、出售、丢弃、交易和扩容命令。货币由 Wallet 契约负责，不占背包容量，也不进入背包 Delta。

## 权威与身份

| 状态或决定 | 权威 | 客户端职责 | 身份键 |
| --- | --- | --- | --- |
| 容器容量 | Game Server | 展示与容量提示 | `playerId + bagType` |
| 物品绝对数量 | Game Server | 缓存并展示 | `playerId + bagType + itemId` |
| Snapshot/Delta 版本 | Game Server | 按容器校验连续性与缺口重拉 | `playerId + bagType` |
| 战斗奖励 | Game Server | 展示结算结果并应用同步数据 | `playerId + battleSessionId` |

`userId/sessionId` 只用于认证和路由。Handler 必须从已认证的 `MessageContext.playerId` 取得背包所有者，不接受客户端上传 `playerId`、最终数量、容量或版本。

## 不变量与状态机

- `capacity >= 1`；当前 `main` 默认 40，`warehouse` 默认 200。
- `itemId > 0`；`count` 由服务端限制在 `0..Number.MAX_SAFE_INTEGER`，JSON 使用 number。
- 每个 `(playerId, bagType)` 独立维护非负 `BIGINT/long` 版本，JSON 使用十进制字符串。
- 一个事务内的多物品变更只增加一次版本；没有普通背包物品变化时版本不变。
- Delta 包含连续的 `baseVersion -> version`，当前要求 `version = baseVersion + 1`。
- 战斗首次成功结算在同一事务内授予奖励并返回 `bagDelta`；重复结算不重复授予，返回当前 `bagSnapshot` 供客户端收敛。
- 客户端收到 `version <= localVersion` 的 Delta 时按重复或过期消息忽略；`baseVersion != localVersion` 时停止应用并请求 Snapshot。
- 登录初始化和重新登录只预加载 `main`，以控制登录查询与报文体积；`warehouse` 首次打开时按需请求完整 Snapshot。客户端在某类型未知、版本缺口或解析失败后，只重拉对应类型，不得继续猜测增量。

## 消息

| 名称 | Scope | 方向 | 语义 |
| --- | --- | --- | --- |
| `BAG_SNAPSHOT_REQUEST` | `game` | Client -> Game Server | 携带 `bagType`，请求已选角色对应容器的完整快照 |
| `BAG_SNAPSHOT_RESPONSE` | `game` | Game Server -> Client | 成功返回 `snapshot`；失败返回稳定 `reason` |
| `BATTLE_COMPLETE_RESPONSE` | `game` | Game Server -> Client | 首次结算可带 `bagDelta`；重复结算带 `bagSnapshot` |
| `GAME_INIT_RESPONSE.sections.bag` | `game` | Game Server -> Client | `bags` 数组；登录/重连当前只含 `main` Snapshot |

普通背包消息由 Gateway 透明转发，不新增 Gateway 业务处理器。

## 字段契约

| 路径 | Java/存储类型 | JSON | TypeScript | 必填与语义 |
| --- | --- | --- | --- | --- |
| `request.bagType` / `snapshot.bagType` / `delta.bagType` | generated enum / `VARCHAR(32)` | `main` 或 `warehouse` | generated `BagType` | 必填；选择和路由容器，不选择玩家身份 |
| `snapshot.capacity` | `INT` | number | number | 必填，正整数 |
| `snapshot.version` | `BIGINT/long` | decimal string | generated `string`，消费时转 `bigint` | 必填，非负 |
| `snapshot.items[]` | record/list | array | array | 必填，可为空，按 `itemId` 升序 |
| `items[].itemId` | `INT` | number | number | 必填，正整数且唯一 |
| `items[].count` | checked `BIGINT` | number | number | 必填，正安全整数；零数量不出现在 Snapshot |
| `delta.baseVersion` | `BIGINT/long` | decimal string | generated `string`，消费时转 `bigint` | 必填，客户端应用前版本 |
| `delta.version` | `BIGINT/long` | decimal string | generated `string`，消费时转 `bigint` | 必填，本批事务后版本 |
| `delta.changes[]` | record/list | array | array | 必填，至少一项且 `itemId` 唯一 |
| `changes[].delta` | checked `long` | number | number | 必填，非零安全整数 |
| `changes[].count` | checked `BIGINT` | number | number | 必填，变更后的绝对安全整数；可为零 |
| `response.success` | boolean | boolean | boolean | 必填 |
| `response.reason` | string | string | string | 失败时必填，成功时省略 |

## 错误

- `player_not_selected`：当前会话没有已验证角色；需重新登录或选择角色。
- `invalid_bag_type`：请求缺少类型、含多余字段或类型不在生成枚举内。
- `bag_snapshot_invalid`：服务端无法构造合法快照；客户端保持未同步状态。
- `bag_version_overflow`：版本无法继续递增；事务回滚，不得部分授予背包物品。

错误响应不得包含数据库结构、堆栈或内部异常文本。

## 版本与兼容

Snapshot 可无条件替换客户端缓存。Delta 只能应用到完全匹配的 `baseVersion`；客户端不缓存乱序 Delta 等待补洞，而是立即请求 Snapshot。新增可选字段必须保持旧客户端可忽略；删除或改变现有字段需要新的协议版本和兼容窗口。

部署顺序为服务端先兼容、再发布客户端；当前消息仍使用 JSON envelope `{msgId, data}`。

## Fixtures

- `fixtures/snapshot-response.json`：主动快照成功响应 data。
- `fixtures/delta.json`：一次多物品事务 Delta。
- `fixtures/error-response.json`：未选择角色失败响应 data。
- `fixtures/init-data.json`：登录只预加载主背包的初始化 section。

Schema 将每个 fixture 绑定到具体 generated type；生成器、服务端序列化测试和客户端解析回归必须共同读取这些文件。

## 验收

- Flyway 将旧单背包数据迁入 `(playerId, main)`，主背包与仓库数据、容量和版本相互隔离。
- 服务端覆盖 Snapshot、单批版本递增、负数/溢出回滚和重复战斗结算不重复授予。
- 客户端覆盖登录原子初始化、主背包/仓库隔离、Snapshot 替换、连续 Delta、重复 Delta、版本缺口按类型重拉和战斗结算同步。
- `message-ids.yaml` 生成物、TypeScript 检查、Maven 测试和 fixture 校验通过。
- 实际 Gateway 链路完成一次登录快照、战斗奖励、重连快照验证。
