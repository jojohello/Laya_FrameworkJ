# Framework-J

Framework-J 是一个面向 2D 游戏的客户端、服务器、配置表和通信协议一体化框架。

## 项目特色：纯 AI 工程化开发

Framework-J 的特点之一，是项目代码、资源接入、文档与日常维护均以 AI 为主要执行者完成。它不是只让 AI 临时补几段代码，而是把工程约束、稳定设计和当前任务一起纳入仓库，让 AI 能够跨会话持续理解并维护整个项目。

仓库采用作用域化的“三 Markdown 文档模式”作为项目知识库：

| 文档 | 知识职责 |
| --- | --- |
| `README.md` | 记录当前已经具备的能力、公开入口、命令和使用方式 |
| `DESIGN.md` | 记录长期稳定的架构边界、实现约束、设计取舍和错误防范规则 |
| `PlanAndStatus.md` | 只记录当前未完成工作、优先级、阻塞和验收条件，完成后及时收敛 |

这些文档按目录就近生效：AI 从仓库根目录向目标模块逐层读取规则，再对照实际代码、配置和生成脚本执行任务。完成工作后，可复用的结果回填到最近的 README 或 DESIGN，已经完成的计划从 Plan 中删除，使仓库本身成为持续更新的工程记忆，而不是依赖单次对话上下文。

仓库还内置了面向 Codex 的专项 Skills，将通用 AI 能力约束为可验证的项目工作流。目前覆盖：

- 客户端、协议、Gateway 与服务器的双端契约设计、代码实现和端到端验证。
- LayaAir 客户端功能开发、战斗运行时问题定位和无 UI 回归验证。
- UI 美术资源生成与调整、九宫格规划、公共资源复用，以及 `.ls`/`.lh` 场景和组件装配。
- 角色帧动画素材制作、图集打包、配置接入与播放链路验证。
- 微信小游戏分包、远程资源、纹理压缩和发布验收。
- README、DESIGN、PlanAndStatus 知识库的读取、维护与任务收敛。

因此 AI 在本项目中不仅可以写单端代码，还可以完成前后端协同开发、生成和接入美术资源、拼装 UI、维护配置与协议，并依据项目文档和 Skills 运行相应验证。需要 LayaAir IDE 生成 `.meta`、执行真机验收或作出产品决策时，则由人提供必要的工具操作与最终确认。

## 技术基线

| 范围 | 技术 |
| --- | --- |
| 客户端 | LayaAir 3.3.11、TypeScript |
| 服务器 | Java 21 字节码目标（使用 JDK 21+ 构建）、Spring Boot 3.2.0、Maven |
| 配置 | CSV 唯一源数据，导出客户端 JSON 与服务器 JSON/Java |
| 协议 | YAML 消息 ID，生成 TypeScript 与 Java 常量 |

## 目录

| 目录 | 职责 | 文档入口 |
| --- | --- | --- |
| `Client/LayaProject` | 客户端生命周期、表现、输入、网络和业务模块 | [客户端 README](Client/LayaProject/README.md) |
| `Sever` | 登录、中心数据、Gateway 和 Game Server | [服务器 README](Sever/README.md) |
| `Config` | 前后端共享配置表及导出工具 | [配置 README](Config/README.md) |
| `Protocol` | 消息 ID 唯一来源及代码生成 | [协议 README](Protocol/README.md) |
| `Doc` | 独立专题资料 | 按任务读取 |

目录名 `Sever` 是当前仓库既有路径。修改它会影响脚本和文档引用，不应作为顺手重命名处理。

## 常用操作

客户端静态检查：

```powershell
cd Client/LayaProject
npx.cmd tsc -p tsconfig.json --noEmit --pretty false
```

配置表导出：

```powershell
node Config/tools/exportClient.js
node Config/tools/exportServer.js
```

协议常量生成：

```powershell
cd Protocol/tools
npm run generate
```

服务器构建：

```powershell
cd Sever
mvn test
```

全项目文档和文本格式检查：

```powershell
powershell -ExecutionPolicy Bypass -File tools/docs/validate-doc-system.ps1
```

客户端运行、场景预览和发布使用 LayaAir IDE 3.3。服务启动顺序、端口及模块命令见 `Sever/README.md`。

## 文档规则

仓库使用作用域化的 `README.md`、`DESIGN.md` 和可选 `PlanAndStatus.md`。具体读取和维护协议见 [AGENTS.md](AGENTS.md)，跨系统设计边界见 [DESIGN.md](DESIGN.md)。
