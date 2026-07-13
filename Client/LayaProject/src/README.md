# 源码目录

`src` 包含客户端 TypeScript 源码，分为启动层、逻辑层和 Laya 脚本组件。

- `start/`：首包启动、登录、网络、加载和平台 SDK。
- `logic/`：逻辑分包中的游戏功能模块。
- `script/`：由 Laya 场景使用的通用脚本组件。

架构与跨目录约束见 [DESIGN.md](DESIGN.md)。具体能力先读所在模块的 `README.md`；只有需要理解内部约束时再读模块 `DESIGN.md`。

## Laya 文件

- `.ls` 是场景，`.lh` 是可复用层级或预制体。
- 运行时加载路径相对 `assets/` 根，不添加 `assets/` 前缀。
- `.ls/.lh` 和 `.meta` 优先由 LayaAir IDE 创建、导入和维护。
- `*.generated.ts` 由编辑器生成，不把手工业务逻辑写入生成文件。

## 验证

TypeScript 静态检查：

```powershell
npx.cmd tsc -p tsconfig.json --noEmit --pretty false
```

静态检查不能替代 LayaAir IDE 中对场景序列化、资源引用、输入和生命周期的运行验证。
