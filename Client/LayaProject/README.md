# Framework-J Laya 客户端

Framework-J 的 LayaAir 3.3 客户端工程，使用 TypeScript，目标平台包括微信小游戏、抖音小游戏和 Web。

## 工程入口

- `src/start/`：启动、登录、网络和平台接入。
- `src/logic/`：进入逻辑分包后的游戏功能模块。
- `src/logic/LogicMain.ts`：逻辑层启动入口和 ManagerHub 注册位置。
- `assets/`：Laya 场景、预制体和运行时资源。
- `assets/logic/`：Logic 代码分包的空资源锚点；入口脚本来自 `src/logic/LogicLib.bundledef`。
- `assets/startupUI/` 与 `assets/ttf/`：微信首包资源；Loading 背景位于 `assets/startupUI/loading_bg.png`。默认字体 `assets/ttf/sourcehansanscn.ttf` 是覆盖当前客户端文案的 Noto Sans SC 子集，使用 [SIL Open Font License 1.1](docs/licenses/NotoSansSC-OFL.txt)；新增界面字符时需同步重新生成并验证字体子集。
- `assets/bigImg/`、`character/`、`config/`、`effects/`、`guides/`、`map/`、`scene/`、`shaders/`、`ui/`：保持现有运行时 URL 的远程资源分包，由 Start Loading 阶段从 `MyGameConfig` 的资源服务器显式加载。
- `assets/testAndSample/`：按主题划分的编辑器专用无 UI 测试包；场景、脚本和 IDE 调用入口都留在该目录。测试脚本集允许编辑器加载但禁止 Runtime 加载，正式入口不得导入测试脚本；打开测试包 README，通过对应 IDE 插件入口运行用例。
- `settings/BuildSettings.json`：LayaAir 构建配置。

## 文档入口

- [AGENTS.md](AGENTS.md)：智能体读取和维护文档的协议。
- [DESIGN.md](DESIGN.md)：客户端全局架构与强制设计规则。
- [PlanAndStatus.md](PlanAndStatus.md)：当前尚未完成的项目工作；没有全局计划时可以不存在。
- [docs/LayaAirVersionBugs.md](docs/LayaAirVersionBugs.md)：已确认并等待引擎升级复查的 LayaAir 版本缺陷。
- [src/README.md](src/README.md)：源码目录说明和 LayaAir 开发注意事项。
- [src/logic/README.md](src/logic/README.md)：逻辑模块索引。
- [src/start/README.md](src/start/README.md)：启动模块索引。
- [.codex/skills/laya-wechat-release-verifier/SKILL.md](.codex/skills/laya-wechat-release-verifier/SKILL.md)：微信小游戏分包、远程资源、ASTC、端口与登录联调的智能体检查流程。

目录中的 `README.md`、`DESIGN.md`、`PlanAndStatus.md` 均按需存在。离实现越近的文档，描述越具体；外层 DESIGN 对所有后代目录生效。

## 开发验证

```powershell
npx.cmd tsc -p tsconfig.json --noEmit --pretty false
powershell -ExecutionPolicy Bypass -File tools/ui/validate-safe-area-relations.ps1
powershell -ExecutionPolicy Bypass -File tools/docs/validate-text-format.ps1
powershell -ExecutionPolicy Bypass -File tools/docs/validate-doc-system.ps1
```

运行和发布使用 LayaAir IDE 3.3。运行时加载 `assets/` 内资源时使用相对资源根的路径，不添加 `assets/` 前缀。
