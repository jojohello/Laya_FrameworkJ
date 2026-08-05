# 编辑器工具设计

本文件作用于 `src/editor/`，继承上层源码与项目设计约束。

## 进程边界

- UI 面板、项目设置和菜单只使用 `@IEditor.*` 与 `Editor.*`。
- 资源数据库、导入处理器和文件元数据读取只使用 `@IEditorEnv.*`、`EditorEnv.*` 与 Scene 进程 Node 能力。
- UI 与 Scene 通过 `Editor.scene.runScript()` 传递 JSON-safe 数据；编辑器工具不得被 Start、Logic、场景脚本或正式运行时静态导入。

## 纹理规则所有权

- `settings/plugin-JFrameworkTextureImportRules.json` 是目录级纹理策略的唯一人工配置入口；图片 `.meta` 是 Laya 导入器生成并由版本管理追踪的结果。
- 使用 `@IEditorEnv.regAssetProcessor()` 的 `onPreprocessImage` 修改内置图片导入器的 `settings`。不得注册自定义 PNG Importer，也不得在预处理回调中再次调用导入或直接写 `.meta`，以免替换内置流程或形成循环。
- 规则只维护 `platformDefault`、`platformAndroid` 和 `platformIOS` 的格式与质量，必须保留 `textureType`、`sizeGrid`、过滤模式及未知导入字段。
- 只有图片实际满足 AtlasConfig 的目录范围、`textureType=2` 和单图尺寸上限时，才视为自动图集接管。手工 `.atlas`、超尺寸散图和不符合图集纹理类型的图片仍应用目录规则。
- 规则变更不自动重导入全项目。批量入口必须先完成无写入审计、显示影响数量并获得确认；发现规则或资源错误时不得开始部分重导入。
- 图片导入设置变化后，必须先等待图片导入完成，再重导入引用它的手工 `.atlas` 与 Tiled JSON。完整目录重导入同样按“图片 → 其他资源”两阶段执行并在阶段间等待，避免依赖资源继续持有旧纹理导入结果。
- 每条纹理规则必须同时声明 PC、Android 和 iOS 格式。PC 开发环境显式使用 `R8G8B8A8`，不得在启用默认压缩后隐式落入 BC1；Android/iOS 默认使用 ASTC 6×6。手工帧图集和无间距 Tiled tileset 的 PC 预览尤其依赖透明通道与准确子区域采样。
- 人工编辑集中在独立的非模态“纹理配置”窗口；窗口使用可撤销的规则列表草稿，保存、审计和应用都必须先通过同一套规则校验。文件夹选择器只能产生相对 `assets/` 的路径，不能把项目外绝对路径写入规则。
- 图片移动事件只触发该图片按新路径重导入；普通 Modified 事件不得再次导入，避免循环。
