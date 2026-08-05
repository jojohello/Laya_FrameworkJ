# 当前开发计划

## 当前目标

完成微信小游戏生产发布验收。Local 环境的微信开发者工具构建、远程资源下载和登录主流程已经可用；后续只处理会影响正式发布质量或目标真机兼容性的事项。

## 工作顺序

- [ ] 修复默认字体：替换或重新生成 `assets/ttf/sourcehansanscn.ttf`，确保字体 `name` 表至少包含 Family、Full Name 和 PostScript Name，并由 LayaAir IDE 重新导入；验收微信开发者工具不再出现 `loadFont` 错误，中文字符覆盖符合现有界面。
- [ ] 消除正式包中的空测试脚本集：当前 LayaAir 3.3.11 在 `allowLoadInRuntime=false` 时仍生成约 914 字节的 `js/TestBulletLifecycle-*.js` 空注册壳并写入 `fileconfig.json`。在不手改发布产物、不破坏 IDE 调用式测试的前提下找到源配置或构建扩展方案；验收 `wxgame` 与 `wxgame-remote` 均不含测试脚本、测试资源或编辑器工具。
- [ ] 配置 Test/Production 的登录 API、HTTPS 资源地址和 Apache/CDN 部署；Login Server 接入真实微信 `code2Session`，AppID/AppSecret 由服务端环境提供，Production 禁止开发凭据和 Gateway 兜底。
- [ ] 在目标 Android/iOS 真机确认实际请求 ASTC KTX、PNG 兼容回退、远程包缓存与失败提示，并完成“启动/登录 → 主界面 → 固定战斗 → 结果 → 背包 → 重新登录”主路径和数据一致性验收。

## 完成条件

- 微信开发者工具无字体加载错误，首包和远程包不含测试产物。
- Production 全链路使用 HTTPS/WSS 与真实微信认证，不含源码内密钥或开发绕过。
- 目标真机证明 ASTC、远程资源、主路径和重新登录后的服务器权威数据均正常。
