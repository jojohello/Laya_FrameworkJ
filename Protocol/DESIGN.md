# 消息 ID 系统设计

## 作用域

本目录统一消息名称、数值 ID、服务器处理作用域，以及跨端业务的稳定负载契约。`message-ids.yaml` 负责 ID；`contracts/<feature>/schema.json` 负责机器可读的 wire 字段、约束、消息绑定和 fixture 映射；同目录 `DESIGN.md` 负责权威、事务、幂等、错误、版本和兼容语义。客户端、Gateway 与 Game Server 不得各自形成隐式 schema。

## 唯一来源

`message-ids.yaml` 是消息 ID 的唯一来源。生成文件和消费端副本不得独立分配编号。

生成流程必须具备以下性质：

- 同一输入重复生成得到相同语义结果。
- 名称唯一、ID 唯一，ID 位于 0-65535。
- 每条消息必须声明 `gateway`、`game` 或 `shared` 作用域。
- 所有纳入版本管理的消费端都能检测与 YAML 的漂移。
- 一次协议变更同时更新客户端与服务器并共同发布。

## 编号稳定性

消息 ID 一旦进入已发布客户端或服务器，就属于兼容性契约。禁止为了整理编号而复用、交换或静默改变已有 ID。

删除消息时保留其编号不再分配。确需不兼容修改时，应明确协议版本、升级顺序和兼容窗口。

分类范围用于可读性，不代替唯一性校验。新增分类前先确认不会与现有范围重叠。

## Start 包边界

客户端 Start 包在 Logic 包加载前处理登录，因此 101-199 的登录消息目前在 `LoginProtocol.ts` 硬编码。这是明确的构建边界，不是第二个编号来源。

修改这些 ID 时必须同时修改 YAML、生成结果和 Start 常量，并实际验证登录。长期方向是让 Start 也消费由 YAML 派生的最小生成文件，消除人工同步。

## 协议作用域

- `gateway`：Gateway 本地处理或产生的认证、心跳和网关控制协议。
- `game`：由 Game Server 处理或产生的游戏业务协议。
- `shared`：Gateway 与 Game Server 都需要使用的系统协议。

客户端生成全部协议。Game Server 只生成 `game/shared`，Gateway 只生成 `gateway/shared`。Gateway 仅本地处理 `gateway` 消息；已认证连接上的其他消息默认透明转发，是否支持由 Game Server 决定。因此新增普通 `game` 协议不得要求修改或重新发布 Gateway。

## Java 消费端

Gateway 与 Game Server 的 Java 类位于不同包且消费的作用域不同。生成器必须同时按目标 package 和 scope 过滤输出，而不是依赖手改、复制完整常量集或业务白名单。

在自动化完成前，任何 YAML 变化都要检查：

- `Sever/gateway-server/.../protocol/MessageIds.java`
- `Sever/game-server/.../protocol/MessageIds.java`

## 负载契约

统一 ID 不代表负载已经统一。新增跨端业务消息时必须建立 `contracts/<feature>/schema.json`、`DESIGN.md` 和必要 fixtures。账号 `userId`、角色 `playerId` 与连接 `sessionId` 必须遵循根级 DESIGN 的语义。

Schema 使用版本化的项目方言并采用关键字白名单。每个 definition 必须是 `additionalProperties: false` 的对象，或值唯一且稳定的小写 string enum；整数必须声明 Java `int/long` 映射及安全范围；bindings 必须引用 `message-ids.yaml` 中存在的消息。生成器输出 Java records/enums、TypeScript interfaces/enums 和客户端结构守卫，同时校验 fixtures。未知关键字必须失败，不得静默忽略。

Schema 只负责可机械验证的 wire 结构。权限、身份来源、事务、幂等、排序、版本连续性、字段间领域关系和部署兼容窗口仍由 DESIGN 与领域测试负责。生成的结构守卫必须在客户端网络边界使用；服务端请求必须先转成生成 DTO 并执行领域校验，不能因为类型由生成器产生就信任客户端。

业务模块可以在自身 DESIGN 记录内部实现，但不得复制完整 wire schema。消费代码只能引用生成 payload 类型；`npm.cmd test` 的 `--check` 必须阻止生成物漂移。

## 错误防范

- 不从 Java 或 TypeScript 常量反向修改 YAML。
- 不提交只更新一端的协议变更。
- 不手写 Java/TypeScript wire DTO 绕过 `schema.json`。
- 不把 Schema 能表达的字段、可选性和数值边界仅写在 Markdown 中。
- 不使用生成日期作为业务版本或兼容性依据。
- 不把 `node_modules` 提交到仓库；依赖由 `package-lock.json` 和 `npm ci` 恢复。
- 生成后运行客户端静态检查与服务器构建，编号对比不能代替编译验证。
