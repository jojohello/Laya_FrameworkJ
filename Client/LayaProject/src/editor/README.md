# 编辑器工具

`src/editor/` 只包含 LayaAir IDE 开发期工具。脚本依靠 `@IEditor.*` 和 `@IEditorEnv.*` 装饰器进入 UI/Scene 编辑器 bundle，不得被运行时代码导入。

## 纹理导入规则

`textureImport/` 维护非自动图集图片的目录级压缩策略：

- 项目规则：`settings/plugin-JFrameworkTextureImportRules.json`
- 工具菜单：`纹理配置`
- 独立窗口：编辑规则列表、从 `assets` 内选择文件夹添加规则、恢复默认、保存、审计、保存并应用，以及完整重新导入规则目录
- 新导入图片：`onPreprocessImage` 自动写入匹配规则
- 已有图片：先审计，再由菜单确认并批量重新导入；图片导入完成后同步重导入引用它的手工 `.atlas` 与 Tiled JSON
- 完整目录重导入：独立按钮按“图片 → 等待完成 → 其他资源 → 等待完成”两阶段重导入所有启用规则目录，重叠目录按资源 UUID 去重
- 移动图片：移动完成后按新目录重新导入

默认对 `bigImg/character/effects/map/startupUI/ui` 递归应用 PC `R8G8B8A8`、Android/iOS `ASTC_6X6` 和普通质量。PC 格式必须显式配置，不能在启用默认压缩后依赖 BC1 兜底；character 帧图集和无间距 Tiled tileset 都需要保留透明度与准确的子区域采样。只有真正会被 `.atlascfg` 纳入自动图集的图片才跳过单图设置；仅仅位于 AtlasConfig 的祖先目录下不构成跳过条件。

规则路径相对于 `assets/`，不添加 `assets/` 前缀。窗口允许手工编辑路径，也可通过文件夹选择器添加，但选择范围被限制在当前项目的 `assets` 内。更深路径优先；重复 ID、重复路径、越界路径、未知纹理格式或非法质量会阻止保存和批量应用。

## 验证

修改工具后运行 TypeScript 检查，随后在 LayaAir IDE 中重载脚本，停止游戏预览，打开“工具 → 纹理配置”，完成一次“保存 → 审计 → 应用并重导入”，必要时执行“重新导入规则目录”。发布微信包后还要确认工具标识没有进入正式 JS bundle。
