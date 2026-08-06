# LayaAir 版本缺陷跟踪

本文件记录已通过项目产物复现、但当前不值得引入项目级兼容代码的 LayaAir 版本问题。升级引擎时逐项复查；若新版本已修复，则同步删除相关临时约束或说明。

每次变更 LayaAir IDE 或引擎版本，都必须先查看官方 GitHub Releases 与目标版本文档的更新说明，再对本文件所有开放项执行升级复查。没有在新版本产物中重新验证的问题不得仅凭更新摘要标记为已修复。

## LAYA-3.3.11-BUNDLEDEF-RUNTIME-SHELL

- **影响版本**：LayaAir 3.3.11
- **状态**：已确认，当前接受，等待引擎升级后复查
- **配置条件**：脚本集保持 `enabled=true`、`allowLoadInEditor=true`、`allowLoadInRuntime=false`
- **现象**：正式微信构建仍生成约 914 字节的 `js/TestBulletLifecycle-*.js`，并在 `fileconfig.json` 中保留对应条目。
- **实际内容**：产物只是脚本集注册空壳，不包含测试用例、测试实体或业务执行逻辑；正式入口也不会加载该脚本集。
- **当前影响**：增加不到 1 KB 的发布体积，不影响运行逻辑，因此不作为当前发布阻塞项。

### 已验证但不采用的规避方式

将脚本集设置为 `enabled=false` 会让测试源码合并进主 Scene bundle。主 Scene bundle 可能在 Logic bundle 注册前取得未定义的基类，进而报错：

```text
TypeError: Class extends value undefined is not a constructor or null
```

项目不为这个空壳维护自定义构建过滤插件，也不手改 `release/` 生成物；测试脚本集继续保持启用且禁止 Runtime 加载。

### 引擎升级复查

升级 LayaAir 后使用现有脚本集配置重新发布微信包，并检查：

1. `wxgame/js/` 是否仍存在 `TestBulletLifecycle-*.js`；
2. `wxgame/fileconfig.json` 是否仍包含 `js/TestBulletLifecycle.js`；
3. 空壳消失后，IDE 调用式测试和正常预览是否仍能加载 Logic 基类。

若三项均正常，将本问题标记为已修复，并更新引用本记录的 README/DESIGN。
