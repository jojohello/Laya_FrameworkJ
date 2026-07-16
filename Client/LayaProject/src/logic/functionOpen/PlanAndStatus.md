# FunctionOpen 当前计划

## 当前目标

建立服务器权威的系统开启体系：支持多态 Condition、事件触发、数据库持久化、客户端状态同步，以及入口隐藏/置灰/点击反馈配置。

## 当前状态

- 已完成参考工程客户端 `FuncOpen`、`func_open.txt`、协议引用和本项目配置加载机制的调研。
- 已确认服务器源码位于 `Sever/game-server`，可以进行服务端 FunctionOpen 设计和实现；参考客户端位于 `dev`。
- 已确定客户端不自行计算最终开启状态，服务器状态是唯一权威。
- 已确定第一版不实现复杂 Condition 组合，每个功能先使用一个简单条件。
- 已确定第一版正式使用 `userId`，无 SDK 时在账号创建阶段生成并持久化。
- 已确定第一版事件只做 `game-server` 内部事件，并先完成服务器自身闭环测试。

## 执行顺序

- [ ] 确认 Central 内部账号 ID 与正式字符串 `userId` 的映射字段和生成位置。
- [ ] 确认 FunctionOpen Repository 的实际落地方式；推荐 MySQL 持久化成功后更新 Redis 缓存。
- [ ] 定位现有游戏事件入口，并建立最小事件发布/订阅契约。
- [ ] 为 `game-server` 增加内部测试事件和 FunctionOpen 幂等闭环测试。
- [ ] 确认登录全量状态和功能开启增量推送的协议字段。
- [ ] 确认当前数字消息 ID 的唯一来源和生成流程，避免直接手改生成文件。
- [ ] 统一协议 ID、消息结构和客户端/服务器生成流程。
- [ ] 将参考 `func_open.txt` 转换为本项目数组 JSON，并确定 `FunctionOpen` 配置字段。
- [ ] 在服务器实现 Condition 接口、条件工厂、事件索引和幂等开启服务。
- [ ] 增加角色功能开启状态持久化及登录加载。
- [ ] 在客户端实现 `FunctionOpenMgr` 和状态变更事件。
- [ ] 实现 `FunctionOpenEntry`，支持隐藏、置灰和未开启点击提示。
- [ ] 实现安全的 routeKey 路由注册，并用一个真实主界面入口完成闭环验证。
- [ ] 第一轮双端协议和事件契约稳定后，创建项目本地双端开发技能，技能内只使用相对路径。

## 需要确认

- [ ] 服务器跨模块修改范围：`game-server`、`common`、协议来源及数据存储服务。
- [ ] 功能开启状态是否只允许“关闭 → 开启”，还是允许运营配置回收功能。
- [ ] 未开启提示是否统一使用 `tipsKey`，还是允许 UI 入口自定义提示。
- [ ] 入口默认策略是否由功能配置决定，并允许单个 UI 入口覆盖。
- [ ] 后续需求：支持多个 Condition 的 AND/OR 组合及嵌套条件组。

## 验收条件

- 服务器事件触发后，功能状态只在数据库事务成功后变为开启。
- 重复事件、重复登录和重复推送不会产生重复开启或错误状态。
- 客户端登录后能正确恢复全量状态，并能处理运行时增量开启。
- 同一功能的不同入口可以分别配置隐藏或置灰。
- 未开启入口无法绕过状态检查进入对应玩法。
- 至少一个真实 UI 入口完成“关闭隐藏/置灰、点击提示、开启后可进入”的 LayaAir IDE 验证。
- 最新决议：正式 `userId` 采用 UUIDv4 小写连字符字符串；内部账号数据库继续使用数值 `id`，通过唯一映射关联。账号创建时生成一次，后续登录不得重新生成。
- 最新决议：第一版不采用 ULID/UUIDv7；可排序身份不是当前 FunctionOpen 的需求。
- 最新决议：FunctionOpen 持久化固定为 MySQL-first，顺序为 MySQL 提交成功后更新 Redis；Redis 更新失败不回滚 MySQL，必须重试、补偿或对账，缓存缺失时从 MySQL 回源重建。
- 最新验收要求：模拟 Redis 更新失败后，MySQL 开启记录仍保留；恢复 Redis 后能够补偿，重复事件和重复补偿均幂等。
- 状态语义已确定为单向开启：记录不存在就是关闭，首次成功写入就是开启，没有撤销分支；重复事件、重复登录和重复推送必须幂等。
- 协议已确定继续使用现有 JSON envelope，不使用 proto；后续统一协议流程只负责公共消息定义、ID 分配和 Java/TypeScript 常量生成。
- 已核对客户端与 Gateway 心跳：心跳使用 2001/2002，仅负责连接保活；FunctionOpen 不新增连接、不复用心跳消息，继续走业务 JSON 消息转发。
- 客户端第一批骨架已开始：增加 FunctionOpen 状态类型、协议处理器、Manager，以及 4001 全量状态和 4002 开启推送消息 ID；服务端尚未实现对应 Handler。
- 本轮已完成服务端第一批实现：`game-server` 增加 FunctionOpen 配置结构、简单 Condition、多态接口、MySQL-first Repository、Redis 更新、4001 全量状态 Handler 和 4002 推送方法。
- Gateway 已放行 4001/4002 消息 ID；已确认心跳 2001/2002 不参与 FunctionOpen。
- `game-server` 与 `gateway-server` Maven 编译均通过；当前没有自动化测试源码，数据库/Redis 实连闭环仍待运行环境验证。
- 初始化方案已确定方向：单一 JSON 初始化入口，内部按 section 聚合各系统自己的 init 数据；FunctionOpen 只负责自己的 section，不承载其他系统数据。
- 第一版不实现应用层分包。需要增加初始化消息大小上限、超限告警，并预留拆分为多个有序逻辑消息的协议字段。
- FunctionOpen 快照数据量预计很小，可放入首个初始化消息；运行时开启仍使用独立增量推送。
- 待后续实施：建立通用 `InitDataProvider`/聚合器，定义 section 名称、版本、完成标记和错误隔离；再将 FunctionOpen 从独立 4001 全量请求迁移或兼容到统一初始化入口。
- 已确认并补齐重连流程：重连成功后重新 Game Login，登录成功回调重新请求 FunctionOpen 全量状态；不能假设断线期间的增量推送仍然可达。
- 待后续完善：统一初始化快照增加 `snapshotVersion`，客户端增加 `stale/loading/ready` 状态，服务端为各 section 提供版本和错误隔离。
- 统一初始化第一版已实现：客户端重连后的登录成功回调请求 105，Game Server 聚合并返回 106，当前包含 `functionOpen` section；Gateway 已放行 105。
- 后续待接入其他系统的 `InitDataProvider`，并增加初始化消息大小预算、section 版本和错误隔离。
- 初始化聚合器和 `GameInitDataProvider` 已完成第一版，FunctionOpen 已作为 provider 接入。
- 已增加 section 错误隔离、初始化 JSON 大小预算和客户端 `snapshotVersion/stale` 状态。
- 待后续：其他系统接入 provider，并在真实多人登录环境验证消息大小、数据库查询并发和 Redis 回源。
- 货币方案评估结论：采用 Item 配置、Wallet 运行时数据；第一版不增加 Currency 配置表，直接复用 Item 的 `type=Currency` 和 icon。
- 统一初始化后续增加 `wallet` section，货币键使用 Item ID；`bag` 只返回普通物品/装备和容量，不返回货币余额。
- 待确认后实施：角色 `player` section、Wallet `wallet` section、Bag `bag` section 的服务端 Provider 和客户端接收模型。
- player、wallet、bag 三个初始化 Provider 和客户端运行时接收已完成，三类数据已进入统一 `GAME_INIT_RESPONSE.sections`。
- 当前服务端角色默认名/等级/经验/体力和背包容量仍是第一版默认值，真实角色创建、属性变化、货币增减、背包写入接口待后续业务系统接入。
- 角色、Wallet、Bag Repository 已增加基础原子写入：先更新 MySQL，成功后更新 Redis；余额和物品数量禁止更新为负数。
- 真实业务规则仍未绑定：货币来源/扣除原因、背包容量校验、角色升级和体力恢复需要由对应玩法服务调用，当前 Repository 只提供数据层能力。
## 2026-07-15 本轮实现结果

- 已完成登录后的统一初始化链路：`GAME_INIT_RESPONSE=106` 的 `player` section 同步到客户端 `PlayerMgr`，字段为 `playerId/name/level/exp/stamina`。
- 已增加 `PLAYER_LEVEL_UP_REQUEST=3012` / `PLAYER_LEVEL_UP_RESPONSE=3013`。服务端只允许数据库中当前等级为 1 的角色原子升至 2 级；MySQL 成功后更新 Redis，Redis 失败不覆盖 MySQL 结果。
- 升级成功后服务端按第一版 Condition 事件 `testEvent=open` 开启 FunctionOpen `1001`，并通过 `FUNCTION_OPEN_PUSH=4002` 增量通知客户端。
- 主界面在玩家 1 级时弹出确认窗口；确认后等待服务端响应，2 级及 FunctionOpen 1001 开启后解除“战斗地图”按钮置灰。
- 点击“战斗地图”切换到已有 `BattleScene`，地图资源继续使用 `map/map002/fightmap.json`；BattleScene 当前提供第一关入口按钮，点击后进入“战斗进行中”状态，作为后续战斗玩法接入点。
- 验证：客户端 `npx.cmd tsc -p tsconfig.json --noEmit --pretty false` 通过；`Sever/game-server` 执行 `mvn test -DskipTests` 通过。尚未进行真实 MySQL/Redis/WebSocket 联调和 LayaAir IDE 运行验收。

## 本轮后续工作

- 在 IDE 中确认按钮皮肤、字体和 tilemap 入口的实际显示效果。
- 增加 game-server 的协议处理单测/集成测试，覆盖重复升级、断线重连初始化和 Redis 写入失败。
- 将 BattleScene 的临时第一关按钮替换为地图对象/关卡配置驱动，并接入真实战斗场景。
