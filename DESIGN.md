# Framework-J 全局设计

## 作用域

本文定义客户端、服务器、配置和协议之间的稳定边界。子项目内部实现由各自 DESIGN 负责；内层规则在不声明例外时继承本文。

## 系统边界

```text
Config/csv ──导出──> Client JSON
     │               Client/LayaProject
     └──────导出──> Server JSON + Java configStruct

Protocol/message-ids.yaml ──生成──> TypeScript / Java MessageIds

Client ──HTTP 登录──> Login Server
Client ──WebSocket──> Gateway <──WebSocket──> Game Server
                            │
                            └──> Central Data Server
```

- Client 负责表现、输入、客户端生命周期和网络适配，不作为游戏权威数据源。
- Sever 负责账号、会话、路由和服务器权威游戏状态。
- Config 是静态策划数据来源，不保存玩家运行时状态。
- Protocol 当前只统一消息 ID；消息负载结构仍由消费端代码定义。

## 身份与数据所有权

- `userId` 表示账号身份，用于登录、认证、会话和网络路由。
- `playerId` 表示游戏角色身份，用于角色状态、背包、进度和房间逻辑。
- `sessionId` 表示一次物理连接。

在角色系统完成前，部分服务器代码仍以 `userId` 承载占位游戏数据。新增服务器权威玩法不得扩大这种混用，应先完成 Account 到 Player 的边界。

## 唯一来源与生成物

- 配置表唯一源数据是 `Config/csv/*.csv`。
- 消息 ID 唯一来源是 `Protocol/message-ids.yaml`。
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

## 目录与依赖

- `Client/LayaProject`、`Sever`、`Config`、`Protocol` 是同一 Git 仓库的组成部分，不得在子目录创建独立 `.git`。
- `Sever` 是既有目录名，重命名属于全仓迁移任务。
- 生成目录、依赖缓存和构建输出不承载设计事实。
- 专用工具可以依赖其输入格式，但业务模块不应反向依赖生成工具实现。

## 文本规范

项目自维护文本统一为 UTF-8 无 BOM、LF。Laya 自动生成的 `.meta` 由客户端作用域排除；`node_modules`、Maven `target`、Server `output` 等依赖或构建目录不参与源码格式治理。
