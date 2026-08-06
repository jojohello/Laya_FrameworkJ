# Protocol 消息 ID 系统

`Protocol` 维护前后端通信消息 ID 和服务器处理作用域。`message-ids.yaml` 是唯一编辑入口，Node.js 工具生成 TypeScript 与按作用域过滤的 Java 常量。

## 目录

```text
Protocol/
├── message-ids.yaml
├── contracts/<feature>/DESIGN.md
├── contracts/<feature>/schema.json
├── contracts/<feature>/fixtures/*.json
├── generated/java/MessageIds.java
├── generated/typescript/MessageIds.ts
├── tools/generate.js
└── tools/generate-contracts.js
```

稳定编号和兼容性规则见 [DESIGN.md](DESIGN.md)，生成链路尚未自动化的部分见 [PlanAndStatus.md](PlanAndStatus.md)。

## 生成

首次使用安装依赖：

```powershell
cd Protocol/tools
npm ci
```

修改 `message-ids.yaml` 或任一 `contracts/<feature>/schema.json` 后运行：

```powershell
npm run generate
```

当前生成器会写入：

- `Protocol/generated/java/MessageIds.java`
- `Protocol/generated/typescript/MessageIds.ts`
- `Client/LayaProject/src/logic/common/MessageIds.ts`
- `Sever/game-server/.../protocol/MessageIds.java`
- `Sever/gateway-server/.../protocol/MessageIds.java`
- `Protocol/generated/{java,typescript}/contracts/<feature>/...`
- 对应 Client 模块的 `*Payloads.generated.ts`
- `Sever/game-server/.../protocol/payload/<feature>/*Payloads.java`
- HTTP 登录契约需要的 `Client/LayaProject/src/start/<module>/*Payloads.generated.ts` 与 `Sever/login-server/.../protocol/payload/<feature>/*Payloads.java`

生成器会按每个消费端写入消息 ID，并从 payload Schema 生成 Java records、TypeScript interfaces 和结构守卫。协议变更后不得手工复制或修补任何生成文件。

## 添加或修改负载

在 `contracts/<feature>/schema.json` 定义字段、必填性、数值边界、条件规则、fixture 映射和传输绑定。WebSocket 消息使用 `bindings`，HTTP 接口使用 `httpBindings`；Schema 是 wire 字段唯一编辑入口，`DESIGN.md` 记录权限、事务、幂等、跨字段业务不变量和兼容策略。

当前 Schema 方言采用封闭白名单；生成器遇到未知关键字、未知引用、未知消息绑定或额外 fixture 字段会直接失败。不要手工创建生成 TypeScript 的 `.meta` UUID；需要资源元数据时由 LayaAir IDE 导入生成。

## 添加消息

在 YAML 中使用唯一的 `UPPER_SNAKE_CASE` 名称、数值和作用域：

```yaml
BAG_SNAPSHOT_REQUEST: { id: 5001, scope: game }
BAG_SNAPSHOT_RESPONSE: { id: 5002, scope: game }
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

生成器检查消息 ID、Schema 支持范围、字段引用、消息绑定、canonical fixtures 和所有生成物漂移。提交前运行：

```powershell
cd Client/LayaProject
npx.cmd tsc -p tsconfig.json --noEmit --pretty false

cd ../../Sever
mvn test

cd ../Protocol/tools
npm.cmd test
```

不要手动修改生成文件来绕过 YAML；下一次生成会覆盖这些修改。

跨端负载结构见 `contracts/<feature>/schema.json`，业务语义见同目录 `DESIGN.md`；canonical fixtures 必须由生成器及双端测试共同校验。当前契约入口包括 [背包](contracts/bag/DESIGN.md) 和 [HTTP 登录](contracts/login/DESIGN.md)。
