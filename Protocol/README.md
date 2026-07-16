# Protocol 消息 ID 系统

`Protocol` 维护前后端通信消息 ID 和服务器处理作用域。`message-ids.yaml` 是唯一编辑入口，Node.js 工具生成 TypeScript 与按作用域过滤的 Java 常量。

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
- `Sever/game-server/.../protocol/MessageIds.java`
- `Sever/gateway-server/.../protocol/MessageIds.java`

生成器会按每个 Java 消费端的正确 package 和 scope 直接写入：客户端获得全部协议，Game Server 获得 `game/shared`，Gateway 获得 `gateway/shared`。协议变更后不得再手工复制或修补常量文件。

## 添加消息

在 YAML 中使用唯一的 `UPPER_SNAKE_CASE` 名称、数值和作用域：

```yaml
ITEM_USE: { id: 5001, scope: game }
ITEM_USE_RESULT: { id: 5002, scope: game }
```

普通业务协议使用 `game`，运行生成器后不应改变 Gateway 的常量文件。认证、心跳等 Gateway 本地协议使用 `gateway`；两端都要引用的系统协议使用 `shared`。

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
