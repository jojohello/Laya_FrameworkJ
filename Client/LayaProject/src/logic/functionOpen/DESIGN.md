# FunctionOpen 系统设计

本文件作用于 `src/logic/functionOpen/`，继承 `src/DESIGN.md` 和根目录 `DESIGN.md`。

## 目标与边界

FunctionOpen 负责判断玩法是否已经被服务器开启，并为客户端 UI 提供统一的入口状态和未开启反馈。

- 服务器是开启状态的唯一权威来源。
- 客户端只缓存服务器下发的状态，不在客户端自行决定最终是否开启。
- 开启条件由服务器使用多态 Condition 实现，客户端不执行服务器条件。
- UI 入口的隐藏、置灰和点击反馈可以由配置决定。
- FunctionOpen 不负责具体玩法逻辑、UI 页面内容或场景切换实现；这些能力通过稳定的 route/事件契约接入。

## 总体结构

```text
服务端
  func_open 配置
       │
       ▼
FunctionOpenService
  ├─ ConditionFactory / IFunctionOpenCondition
  ├─ 事件订阅与受影响功能索引
  ├─ 角色开启状态持久化
  └─ 登录全量下发 / 开启时增量推送
       │
       ▼
客户端 FunctionOpenMgr
  ├─ 静态 FuncOpen.json
  ├─ 服务器状态缓存
  ├─ isOpen / checkOpen / getConfig
  └─ 状态变更事件
       │
       ▼
UI FunctionOpenEntry / 页面业务绑定
  ├─ hidden
  ├─ disabled
  ├─ 未开启提示
  └─ routeKey 或页面自定义点击处理
```

## 配置表设计

参考工程 `func_open.txt` 中的 `level`、`stage`、`days`、`weeks`、`charge` 是不同条件的平铺字段。项目自己的配置表先转换为 Laya 客户端使用的数组 JSON，主键统一使用 `ID`。

推荐的长期字段如下：

| 字段 | 类型 | 说明 |
|------|------|------|
| `ID` | number | 系统唯一 ID |
| `nameKey` | number | 名称文本 ID |
| `tipsKey` | number | 未开启提示文本 ID |
| `icon` | string | 可选入口图标 |
| `closedDisplay` | string | `hidden` 或 `disabled` |
| `closedClick` | string | `tip`、`ignore` 或约定的自定义行为 |
| `routeKey` | string | 默认开启后跳转路由，不存 TypeScript 类名 |
| `routeArgs` | array | 默认路由参数 |
| `conditionType` | string | 第一版单个服务端条件类型 |
| `conditionValue` | number/string | 第一版条件参数 |

例如：

```json
{
  "ID": 1001,
  "nameKey": 523001001,
  "tipsKey": 510001001,
  "icon": "",
  "closedDisplay": "disabled",
  "closedClick": "tip",
  "routeKey": "main.growth",
  "routeArgs": [],
  "conditionType": "mainStage",
  "conditionValue": 2
}
```

第一版不实现复杂条件组合。每个功能先只配置一个简单条件；后续如果需要多个条件、AND/OR 或嵌套条件组，再扩展为 `conditions` 和显式组合节点。

参考表中的 `nav` 不建议原样作为长期 UI 绑定协议。迁移阶段可以保留 `legacyNav`，由路由适配层兼容旧数组。

## 服务端 Condition

服务端应提供统一条件接口，具体命名可根据服务器框架调整。第一版一个功能配置只创建一个条件实例：

```typescript
interface IFunctionOpenCondition {
    readonly type: string;
    evaluate(context: FunctionOpenContext): boolean;
    getWatchKeys(): readonly string[];
}
```

条件工厂按 `type` 创建实例，例如：

- `roleLevel`：角色等级达到阈值
- `mainStage`：主线进度达到阈值
- `charge`：累计充值达到阈值
- `days`：创建角色或开服达到天数
- `weekday`：指定星期开放
- `event`：收到某个领域事件后满足条件

Condition 不应直接写数据库，也不应直接向客户端推送。它只负责根据上下文判断，并声明自己关注的事件键。`FunctionOpenService` 负责调度、状态变更、事务持久化和推送。

## 事件驱动与持久化

服务器在角色登录时读取该角色已经开启的功能状态；未记录的功能默认为关闭。业务事件发生时，只重新评估声明关注该事件的条件，不扫描所有功能。

开启流程：

1. 领域模块发布事件，例如 `role.level.changed` 或 `main.stage.completed`。
2. FunctionOpenService 根据事件索引找到受影响的功能。
3. 重新构造条件上下文并评估条件。
4. 关闭到开启只允许发生一次，使用幂等更新。
5. 在数据库事务中写入角色功能状态。
6. 持久化成功后发送 `FunctionOpenOpened` 推送。
7. 客户端更新缓存并派发 UI 状态变更事件。

建议的持久化记录为一行一个角色功能：

```text
role_function_open
  role_id
  function_id
  status
  opened_at
  version
```

唯一键使用 `(role_id, function_id)`。不要只在内存中记录开启状态，也不要在数据库写入成功前发送客户端开启通知。

## 客户端与服务器契约

客户端需要两类数据：

- 登录响应中的全量 `functionOpenStates`
- 运行时的 `functionOpenOpened` 增量推送

建议数据结构：

```typescript
interface FunctionOpenState {
    id: number;
    opened: boolean;
    openedAt?: number;
    version?: number;
}
```

客户端 `FunctionOpenMgr` 对外提供：

```typescript
isOpen(id: number): boolean;
getConfig(id: number): FuncOpenConfig | null;
getState(id: number): FunctionOpenState | null;
checkOpen(id: number): boolean;
refreshAll(states: readonly FunctionOpenState[]): void;
applyOpened(state: FunctionOpenState): void;
```

服务器状态未知时不能默认当作已开启。入口应保持安全关闭，并记录缺失状态日志，避免登录数据尚未完成时绕过权限。

## UI 绑定方案

### 主界面导航配置边界

`FunctionOpen` 与主界面导航不是同一张表：

- `FunctionOpen` 只保存玩法是否开启、未开启时显示/点击策略和玩法条件；它是服务端权威状态的客户端镜像。
- `MainNav` 保存导航入口的顺序、显示文字、图标、`routeKey` 和路由参数；它不保存角色开启状态。
- 一个 FunctionOpen 可以绑定多个导航入口；一个导航入口最多绑定一个 `functionId`。`functionId=0` 表示当前入口不受 FunctionOpen 限制。
- `routeKey` 必须是稳定的业务路由键，由客户端路由注册表解释，配置不得直接填写 TypeScript 类名、方法名或脚本。
- 导航组件读取 `MainNav` 后再向 `FunctionOpenMgr` 查询状态。点击时必须再次检查开启状态，避免状态更新与点击之间产生竞态。

当前客户端的 `MainNav.json` 是第一版实现，使用 `label` 作为临时文字字段；接入本地化后，将逐步替换为 `nameKey`，不改变入口 ID、图标和路由字段。

推荐提供可挂载到 `GButton` 或其宿主节点的 `FunctionOpenEntry` 脚本组件，暴露：

- `functionId`
- `closedDisplayOverride`（可选，覆盖表配置）
- `routeKeyOverride`（可选）
- `routeArgs`

组件生命周期中完成：

1. 绑定 FunctionOpenMgr 的状态变更事件。
2. 根据 `closedDisplay` 设置 `visible` 或 `enabled`。
3. 开启状态变化时刷新，不要求页面重新创建。
4. 点击时再次调用 `checkOpen`，避免状态过期。
5. 未开启按 `closedClick` 反馈；已开启交给 `FunctionOpenRouteRegistry` 或页面自定义回调。
6. `onDisable` 中解除事件和点击监听。

路由表只保存稳定字符串到业务入口的映射，不允许配置直接保存类名、方法名或任意脚本表达式。

同一个功能可能有多个入口，因此“默认显示策略”放在 FunctionOpen 配置中，“单个入口的特殊表现”允许组件覆盖。这样既能统一策划配置，也能支持同一玩法在不同页面采用隐藏或置灰。

## 服务器代码范围与当前约束

服务器工程位于 `Sever/`，游戏逻辑服务器位于 `Sever/game-server/`。当前已确认：

- `game-server` 是 Spring Boot / Maven 服务，负责游戏消息分发和玩法状态。
- `ConfigManager` 预加载 `configStruct` 下的 JSON 表结构，因此服务端需要新增 `FuncOpenConfig` 结构并让配置输出包含该表。
- 消息通过 `GameMessage`、数字 `MessageIds` 和 `MessageHandler` 分发；新增协议需要同时增加 ID、数据结构、Handler 或登录响应字段，以及客户端对应解析。
- `Gateway` 只负责连接和路由，FunctionOpen 业务不应放进 Gateway。
- 第一版正式使用 `userId` 作为功能状态键。SDK 登录时由 SDK/账号体系提供；无 SDK 时在账号创建阶段生成一次并持久化，后续登录不得重新生成。
- 现有服务器同时存在 Central 的内部数值账号 ID 和协议层字符串 `userId`，两者必须明确映射；FunctionOpen 不应把一次性登录凭证或临时 guest 字符串当作永久身份。
- `game-server` 启动类排除了 JDBC 自动配置，但 `pom.xml` 和 `application.yml` 已存在 MySQL 配置；Redis 已具备热状态能力。
- `database-server` 当前不是父 Maven reactor 的活动模块，不能直接假设它已经提供角色数据写接口。
- 当前 `game-server` 和 `common` 未发现通用领域事件总线；第一版需要补充最小的进程内事件发布/订阅契约，后续再根据跨服务器事件需求扩展。

Redis 不会自动把数据写入 MySQL，必须由应用层实现同步或异步持久化。FunctionOpen 是不可逆开启状态，建议采用 MySQL 持久化成功后更新 Redis 的 write-through 顺序；如果确实采用 Redis 先写、异步落库，则必须增加可靠队列、重试、补偿和重启恢复，不能只依赖普通 Redis Key。现有 Login Server/Central Data Server 的数据库方法主要负责账号、会话和网关分配，不等于已有 FunctionOpen 玩法数据写入接口。

第一版可以在 `game-server` 内建立 `FunctionOpenRepository` 接口和一个明确的 MySQL/数据服务适配实现，Redis 只作为在线状态缓存。这样不阻塞内部闭环，也避免未来把账号服务强行变成游戏状态服务。

参考客户端工程 `dev/` 包含：

- `src/business/game/funcopen/FuncOpenModel.ts`
- `src/business/game/funcopen/FuncOpenController.ts`
- `src/business/game/config/part/FuncOpenConfig.ts`
- `assets/resources/config/func_open.txt`
- `proto/` 中的参考协议定义

`config/output/server/func_open.txt` 是配置输出结果，不是服务器逻辑实现。

## 双端协议工作流

FunctionOpen 属于跨客户端、游戏服务器、配置和数据服务的联合改动，必须按契约顺序执行：

1. 先固定正式 `userId` 的生成、保存和跨服务传递规则。
2. 先固定状态来源、协议 ID 和推送方向，再修改共享协议/消息 ID 来源。
3. 服务端实现配置读取、Condition、状态存储、登录全量下发和开启增量推送。
4. 客户端实现状态缓存、状态变更事件和 UI 入口绑定。
5. 先在 `game-server` 内用测试事件完成“条件满足 → 持久化 → 状态查询 → 重复事件幂等”的闭环。
6. 再使用重复事件、断线重连、重复登录和未开启点击完成双端验证。

后续可将这套流程沉淀为项目技能。技能中只使用仓库相对路径，例如 `src/logic/functionOpen/`、`Sever/game-server/`、`Sever/common/`，并在执行前从当前工作目录解析两个项目根目录，不写死机器绝对路径。
- 对外正式 `userId` 采用 UUIDv4 小写连字符字符串，由账号创建流程生成一次并永久保存；有 SDK 时绑定 SDK 提供的账号身份，没有 SDK 时由账号服务生成。
- Central/账号库现有数值 `id` 继续作为内部数据库主键，通过唯一的 `userId` 映射到内部 `id`。
- 第一版不采用 ULID 或 UUIDv7；可排序身份不是 FunctionOpen 当前的需求，未来需要时再单独评估 UUIDv7。
- FunctionOpen 持久化固定为 MySQL-first：MySQL 事务成功提交后更新 Redis。Redis 更新失败不得回滚 MySQL，必须进入重试/补偿或对账流程；Redis 缺失时从 MySQL 回源并重建缓存。
- Redis 不会自动替 MySQL 持久化，以上顺序必须由 `game-server` 应用层实现，并由 `FunctionOpenRepository` 负责落地。
- 开启状态采用单向状态机：记录不存在等价于 `closed`，第一次成功写入开启记录后变为 `opened`；业务上不存在撤销操作，因此重复事件只做幂等检查。
- 第一版协议继续使用现有 JSON envelope，不引入 proto。FunctionOpen 只新增消息 ID、请求/响应或推送数据结构，并接入当前 `GameMessage`、`MessageIds`、`MessageHandler` 流程。
- 心跳链路已核对：客户端 `HeartbeatManager` 使用 `msgId=2001`，Gateway 在 WebSocket 层处理并返回 `2002`；心跳只负责连接保活，不承载 FunctionOpen 状态。
- FunctionOpen 业务消息继续复用同一 JSON WebSocket envelope，由 Gateway 按业务 `msgId` 转发到 Game Server，并使用已认证 session 注入的正式 `userId`。
- 服务端已按当前 JSON envelope 增加 4001 全量状态和 4002 开启推送；Gateway 仅负责放行和转发，心跳 2001/2002 仍属于连接层。
- 当前 Repository 以 MySQL 唯一主键 `(user_id, function_id)` 保证首次开启幂等，MySQL 成功后尝试写 Redis；Redis 异常不覆盖 MySQL 结果，后续需补齐显式重试/对账任务。
- 登录初始化采用“单一聚合入口、模块独立提供数据”的方案：服务端由初始化聚合器调用各系统 init provider，客户端收到一个带模块名的 JSON 初始化对象，各系统只解析自己的 section。
- 这不是把 FunctionOpen 变成全游戏数据接口。FunctionOpen 只提供自己的 `functionOpenStates`，背包、任务、角色等系统分别注册自己的初始化 section，避免模块互相依赖。
- 第一版可以发送一个 JSON 初始化消息，但必须设置消息大小预算和日志监控；超过预算的模块不得继续无限追加到同一消息，应改为多个有序的逻辑初始化消息。当前客户端/服务端没有应用层分包和组包协议，不能假设 WebSocket 底层分片能解决业务消息大小问题。
- 初始化采用“全量快照 + 运行时增量推送”：登录或重连时发送快照，之后用独立增量消息更新。快照/增量是常见的状态同步模式；WebSocket 标准虽然支持帧级分片，但那不等于项目已有可重试、可校验的应用层分包协议。[RFC 6455](https://www.rfc-editor.org/rfc/rfc6455/)
- 多人同时登录时的主要风险不是 FunctionOpen，而是所有系统初始化查询和序列化集中发生。聚合器应按用户串行组装、限制单条消息大小，并让重数据模块延迟加载或后续分批。
- 断线重连必须视为新的业务会话：Socket 重建后先重新发送 Game Login，Gateway 恢复 userId 路由，登录成功后重新请求初始化快照。不能只依赖断线前的客户端缓存。
- 客户端可以暂时保留旧快照用于界面稳定，但在新快照返回前应标记为 `stale`，禁止把旧状态当作服务器最新权威状态；收到快照后以全量替换为准。
- 运行时增量消息可能在断线窗口丢失，因此不能只依赖增量恢复。重连快照是最终一致性兜底；后续可增加 `snapshotVersion`/`eventVersion` 做版本校验。
- 统一初始化协议第一版使用 `GAME_INIT_REQUEST=105` / `GAME_INIT_RESPONSE=106`。响应包含 `snapshotVersion` 和按模块划分的 `sections`；当前已接入 `functionOpen.states`。
- 4001 FunctionOpen 全量状态接口暂时保留作为兼容和单独刷新入口，但登录、重连恢复优先请求统一初始化协议。
- 初始化聚合器已抽象为 `GameInitDataProvider`；每个 provider 独立生成 section，单个 provider 异常不会阻断其他 section。
- 服务端对初始化 JSON 做 UTF-8 字节大小检查，超限返回 `payload_too_large`，不继续发送无限增长的快照。
- 客户端 FunctionOpen 记录 `snapshotVersion` 与 `stale` 状态；请求重连快照时先标记 stale，快照成功后再恢复可用。
- 货币采用“Item 配置 + Wallet 运行时数据”的混合方案：货币可以是 Item 表中的一种 `type=Currency`，继续复用名称、icon、品质等展示配置；运行时余额不计入背包容量、不使用普通物品堆叠规则，由 Wallet 负责原子增减和持久化。
- 第一版不新增独立 Currency 配置表。现有 Item 配置已经能够表达货币身份和 icon；统一初始化只增加 `wallet` section，使用 Item ID 作为货币键，例如 `{ "1001": 10000 }`。
- 只有出现货币专属字段时才新增 Currency 配置表，例如货币代码、精度、上限、是否允许负数、兑换关系、充值渠道或运营排序。届时 Currency 表通过 `itemId` 关联 Item 表，icon 仍只维护在 Item 表。
- 服务器现有 `GetPlayerInfoHandler` 中的 `gold/diamond` 仍是 Mock 字段，不能继续作为正式角色基础数据；后续应迁移为 Wallet 数据来源。客户端当前 Bag 的 Currency 物品标记保留用于展示兼容，但余额读取和修改应逐步切到 Wallet。
- `player` section 当前字段为 `playerId/name/level/exp/stamina`；`wallet` 使用 Item ID 到余额的映射；`bag` 使用容量和普通物品列表。客户端已分别接入 PlayerMgr、WalletMgr 和 BagMgr 初始化。
- 服务端第一版为三类数据建立独立 Repository/table：`player_state`、`player_wallet`、`player_bag_item`。角色首次初始化会创建稳定 playerId；货币只从 Item 配置中筛选 `type=Currency`，不增加 Currency 表。
- 角色进度、Wallet 余额和 Bag 数量的基础修改均采用数据库条件更新保证并发下不出现负数；Redis 只是成功写库后的热缓存，写缓存失败不覆盖 MySQL 结果。
- Repository 不负责玩法规则和操作来源校验；调用方必须在上层提供 reason、权限、容量和业务条件，后续需要增加统一领域 Service 与操作日志。
## 当前可运行闭环

首个演示闭环使用 FunctionOpen `1001` 作为战斗地图入口：登录后统一初始化玩家；玩家为 1 级时客户端弹出升级确认；确认请求由 game-server 原子更新 MySQL，成功后写 Redis、开启 FunctionOpen 并推送玩家/功能状态；客户端解除按钮置灰，点击后进入 BattleScene。BattleScene 的第一关按钮目前是临时运行时控件，点击仅改变为“战斗进行中”，真实战斗流程仍属于后续模块。

升级操作不接受客户端传入等级、经验或体力，服务端以 `level = 1` 条件执行 `level = level + 1`，避免客户端伪造进度；重复请求返回失败且不会重复开启功能。
