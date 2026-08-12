# 设置系统

设置系统是主界面的本地功能内页，通过底部导航的 `main.settings` 路由打开 `SettingsUI`。

## 当前能力

- `SettingsViewController` 经 `App.musicMgr` 调用 Start 层的统一音频服务，不静态导入 Start 实现。
- 支持总静音、背景音乐开关、音乐音量、音效开关和音效音量。
- 开关和滑杆修改即时生效；持久化由 `MusicMgr` 负责，设置页不维护第二份缓存。
- 滑杆位置保持线性 `0..1`；感知音量曲线由 `MusicMgr` 在输出边界统一处理，设置页不转换增益。
- 音量滑杆使用青蓝色填充，与暖奶油色设置分区保持清晰对比。
- 页面位于 `MainContent` 层，底部使用与背包一致的高不透明度灰蓝承托底板，顶部 HUD 和底部导航继续位于其上并保持可见、可点击。
- 页面关闭和开关操作复用 `sound/click.mp3` 点击反馈；进入静音前播放，解除静音后播放。

## 入口

```typescript
await UIManager.instance.open("SettingsUI");
```

通常由 `MainNavRouteRegistry` 处理 `main.settings`，业务代码不直接依赖页面路径。
