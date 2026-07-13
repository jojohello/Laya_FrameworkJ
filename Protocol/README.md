# Protocol 消息 ID 系统

`Protocol` 维护前后端通信消息 ID。`message-ids.yaml` 是唯一编辑入口，Node.js 工具生成 TypeScript 与 Java 常量。

## 目录

```text
Protocol/
├── message-ids.yaml
├── generated/java/MessageIds.java
├── generated/typescript/MessageIds.ts
└── tools/generate.js
```

稳定编号和兼容性规则见 [DESIGN.md](DESIGN.md)，生成链路尚未自动化的部分见 [PlanAndStatus.md](PlanAndStatus.md)。

## 生成

首次使用安装依赖：

```powershell
cd Protocol/tools
npm ci
```

修改 `message-ids.yaml` 后运行：

```powershell
npm run generate
```

当前生成器会写入：

- `Protocol/generated/java/MessageIds.java`
- `Protocol/generated/typescript/MessageIds.ts`
- `Client/LayaProject/src/logic/common/MessageIds.ts`

客户端 TypeScript 输出已自动同步。Gateway 与 Game Server 使用各自包名下的 `MessageIds.java`，当前尚未由生成器直接写入；协议变更时必须人工同步并通过服务器构建确认，自动化工作已记录在当前 Plan。

## 添加消息

在 YAML 中使用唯一的 `UPPER_SNAKE_CASE` 名称与数值：

```yaml
ITEM_USE: 5001
ITEM_USE_RESULT: 5002
```

运行生成器后，同时提交 YAML、`generated` 中的输出、客户端生成文件以及受影响的服务器消费端。

## 当前编号范围

| 范围 | 用途 |
| --- | --- |
| 101-199 | 客户端 Start 包启动消息 |
| 1000-1999 | Gateway 认证 |
| 2000-2999 | 心跳 |
| 3000-4999 | 游戏逻辑 |
| 5000-8999 | 物品与背包等扩展玩法 |
| 9000-9999 | 系统消息 |

`LOGIN`、`LOGIN_SUCCESS`、`LOGIN_FAILED` 还在客户端 `src/start/login/LoginProtocol.ts` 中硬编码。修改 101-199 范围必须同步该文件并验证完整登录流程。

## 校验

生成器当前检查数值类型、0-65535 范围和重复 ID。提交前还应运行：

```powershell
cd Client/LayaProject
npx.cmd tsc -p tsconfig.json --noEmit --pretty false

cd ../../Sever
mvn test
```

不要手动修改生成文件来绕过 YAML；下一次生成会覆盖这些修改。
