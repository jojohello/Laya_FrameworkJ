# Framework-J

Framework-J 是一个面向 2D 游戏的客户端、服务器、配置表和通信协议一体化框架。

## 技术基线

| 范围 | 技术 |
| --- | --- |
| 客户端 | LayaAir 3.3.11、TypeScript |
| 服务器 | Java 25、Spring Boot 3.2.0、Maven |
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
