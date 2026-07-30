# Framework-J Laya 客户端

Framework-J 的 LayaAir 3.3 客户端工程，使用 TypeScript，目标平台包括微信小游戏、抖音小游戏和 Web。

## 工程入口

- `src/start/`：启动、登录、网络和平台接入。
- `src/logic/`：进入逻辑分包后的游戏功能模块。
- `src/logic/LogicMain.ts`：逻辑层启动入口和 ManagerHub 注册位置。
- `assets/`：Laya 场景、预制体和运行时资源。
- `assets/testAndSample/`：按主题划分的编辑器专用无 UI 测试包；每个 `testXxx/` 自带场景、脚本和 IDE 脚本集定义。测试脚本集允许编辑器加载，但禁止正式运行时加载；正式入口不得导入测试脚本。打开测试包 README 可按场景直接运行用例。
- `settings/BuildSettings.json`：LayaAir 构建配置。

## 文档入口

- [AGENTS.md](AGENTS.md)：智能体读取和维护文档的协议。
- [DESIGN.md](DESIGN.md)：客户端全局架构与强制设计规则。
- [PlanAndStatus.md](PlanAndStatus.md)：当前尚未完成的项目工作；没有全局计划时可以不存在。
- [src/README.md](src/README.md)：源码目录说明和 LayaAir 开发注意事项。
- [src/logic/README.md](src/logic/README.md)：逻辑模块索引。
- [src/start/README.md](src/start/README.md)：启动模块索引。

目录中的 `README.md`、`DESIGN.md`、`PlanAndStatus.md` 均按需存在。离实现越近的文档，描述越具体；外层 DESIGN 对所有后代目录生效。

## 开发验证

```powershell
npx.cmd tsc -p tsconfig.json --noEmit --pretty false
powershell -ExecutionPolicy Bypass -File tools/docs/validate-text-format.ps1
powershell -ExecutionPolicy Bypass -File tools/docs/validate-doc-system.ps1
```

运行和发布使用 LayaAir IDE 3.3。运行时加载 `assets/` 内资源时使用相对资源根的路径，不添加 `assets/` 前缀。
