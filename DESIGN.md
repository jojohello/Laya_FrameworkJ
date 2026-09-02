# Framework-J 全局设计

## 作用域

本文定义客户端、服务器、配置和协议之间的稳定边界。子项目内部实现由各自 DESIGN 负责；内层规则在不声明例外时继承本文。

## 系统边界

```text
Config/csv ──导出──> Client JSON
     │               Client/LayaProject
     └──────导出──> Server JSON + Java configStruct

Protocol/message-ids.yaml ──生成──> TypeScript / Java MessageIds
Protocol/contracts/*/schema.json ──生成──> TypeScript guards / Java payload records

Client ──HTTP 登录──> Login Server
Client ──WebSocket──> Gateway <──WebSocket──> Game Server
                            │
                            └──> Central Data Server
```

- Client 负责表现、输入、客户端生命周期和网络适配，不作为游戏权威数据源。
- Sever 负责账号、会话、路由和服务器权威游戏状态。
- Config 是静态策划数据来源，不保存玩家运行时状态。
- Protocol 统一消息 ID 和 wire payload 结构；跨客户端与服务器的稳定业务契约集中在 `Protocol/contracts/<feature>/`，消费端代码不得各自形成第二套字段或语义。

## 身份与数据所有权

- `userId` 表示账号身份，用于登录、认证、会话和网络路由。
- `playerId` 表示游戏角色身份，用于角色状态、背包、进度和房间逻辑。
- `sessionId` 表示一次物理连接。

在角色系统完成前，部分服务器代码仍以 `userId` 承载占位游戏数据。新增服务器权威玩法不得扩大这种混用，应先完成 Account 到 Player 的边界。

## 精确整数边界

- 不把多个身份字段通过十进制拼接、乘法或位移强行组成一个更大的业务 ID。跨游戏服角色身份使用结构化 `(gameServerId, playerId)`。
- MySQL `BIGINT` 和 Java `long` 可以保存 64 位整数，但 JavaScript `number` 只能精确保存到 `2^53-1`。64 位 ID、经验、货币等可能超过该范围的字段必须以十进制字符串通过 JSON 传输。
- 客户端需要计算精确整数时使用 `bigint`；只允许把已经证明处于安全范围内的局部值、比例或余数转换为 `number`。
- 服务端对 `long` 加减使用溢出检查并拒绝负数或越界结果。若策划明确需要超过有符号 64 位，字段单独迁移为 Java `BigInteger`、MySQL `DECIMAL(65,0)`，协议继续使用十进制字符串。

## 唯一来源与生成物

- 配置表唯一源数据是 `Config/csv/*.csv`。
- 消息 ID 唯一来源是 `Protocol/message-ids.yaml`。
- 跨端 payload 字段唯一来源是 `Protocol/contracts/<feature>/schema.json`；`DESIGN.md` 只承载 Schema 无法表达的权威、事务、幂等、版本和兼容语义。
- 生成的 JSON、Java 和 TypeScript 文件不得作为独立编辑入口。
- 生成器、源文件和所有消费端必须在同一变更中保持一致。

若生成器不能覆盖某个消费端，应在对应 Plan 记录并通过差异校验防止漂移，不能仅依赖文档提醒人工记忆。

## 跨系统变更

配置字段、消息 ID、认证字段或身份语义属于跨系统契约。修改时必须：

1. 明确唯一来源和受影响消费端。
2. 更新源文件并运行生成器。
3. 更新客户端和服务器使用处。
4. 分别运行静态检查、服务器构建和必要的端到端验证。

不能用“某一端可以编译”代替契约一致性验证。

## 跨端功能交付

涉及客户端与服务器共同实现的功能必须使用根级 `$laya-client-server-feature` Skill，并按权威边界、协议草案、服务端领域逻辑、协议定稿、客户端状态逻辑和跨端集成的 Gate 顺序推进。

- 客户端发送意图并展示服务端结果，不决定奖励、余额、背包数量、胜负、进度或权限等权威状态。
- 服务端从已认证上下文解析 `playerId`，负责校验、事务、幂等、持久化、版本和错误结果；不得信任客户端声明的最终状态。
- 跨端稳定契约的机器 Schema、共同 JSON fixture 和语义 DESIGN 位于 `Protocol/contracts/<feature>/`；客户端和服务端只能消费生成类型并记录各自内部实现与入口。
- 当前未完成 Gate 可写入契约包内的 `PlanAndStatus.md`，完成后删除；不得保留进度日记。

## 目录与依赖

- `Client/LayaProject`、`Sever`、`Config`、`Protocol` 是同一 Git 仓库的组成部分，不得在子目录创建独立 `.git`。
- `Sever` 是既有目录名，重命名属于全仓迁移任务。
- 生成目录、依赖缓存和构建输出不承载设计事实。
- 专用工具可以依赖其输入格式，但业务模块不应反向依赖生成工具实现。

## 文本规范

项目自维护文本统一为 UTF-8 无 BOM、LF。Laya 自动生成的 `.meta` 由客户端作用域排除；`node_modules`、Maven `target`、Server `output` 等依赖或构建目录不参与源码格式治理。

## 新游戏启动边界

Framework-J 是游戏框架，不是某一款新游戏的产品决策者。新项目启动必须把“框架可运行性”和“游戏方向成熟度”分开处理：先验证本地客户端、服务器及其登录链路，再确定足以支持下一次实验的最小产品基线。

“我要做塔防”或其他类型级描述是合理的探索入口，但不是可直接实施的正式需求。AI 应将其路由到探索原型：用最少的临时代码和临时资源验证一至两个核心假设，保留暂停、修改和推翻方向的能力。没有用户确认的主要用户、玩家承诺、核心循环、第一版边界、验证方式和明确排除项，不得扩大为正式生产。

AI 必须区分建议、候选结论和用户确认的产品基线。原型结果不能自动提升项目阶段，也不能替代用户对继续、调整或停止的决定。需要正式阶段判断时使用 `assess-game-project-stage` Skill；不以文档数量、代码规模、评分或“已锁定”等标签越过阻断门禁。
